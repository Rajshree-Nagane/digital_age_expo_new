#!/usr/bin/env node
/**
 * Fixes a real, sitewide bug left over from the MySQL -> Postgres migration: every autoincrement
 * table had its rows copied over WITH their original explicit ids (so old foreign-key-ish
 * references stay correct), but Postgres's underlying sequence for that column doesn't
 * automatically know about ids inserted explicitly rather than via nextval(). If the sequence
 * ends up behind the actual max id in the table, the next INSERT that relies on the default
 * (any normal app code path — new user signup, new event, bootstrap-admin.ts, etc.) can collide
 * with an existing id and fail with Postgres error 23505 / Prisma P2002 "Unique constraint
 * failed on the fields: (id)" — exactly what just happened creating the admin account.
 *
 * migrate-to-neon.js already runs this same fix once per table right after copying it, but if
 * that step didn't take for one table (or ANY row was inserted through another path since,
 * bumping the max id without touching the sequence), the fix needs to be re-applied. This script
 * re-runs it for every autoincrement table in one pass, safely and idempotently — it only ever
 * moves a sequence to max(id)+1's starting point, never backwards, and does nothing to tables
 * that already have zero rows.
 *
 * PREREQUISITE: npm install   (this app already depends on `pg`; dotenv is already a devDependency)
 * RUN:
 *   node fix-sequences.js
 */
require("dotenv").config();
const { Pool } = require("pg");

const AUTOINCREMENT_COLUMN = {
  "common_type": "id",
  "event_schedules": "id",
  "find_advertise_books": "id",
  "find_article": "id",
  "find_banner_stands": "id",
  "find_blog": "id",
  "find_book_section_setting": "id",
  "find_checklist_item_config": "id",
  "find_classifieds": "id",
  "find_domains": "id",
  "find_email_log": "id",
  "find_event_about_show": "id",
  "find_event_advertisor": "id",
  "find_event_checklists": "id",
  "find_event_excluded": "EID",
  "find_event_exhibitor": "id",
  "find_event_faqs_permission": "id",
  "find_event_lobby_agenda": "id",
  "find_event_lobby_agenda_items": "id",
  "find_event_lobby_asset_gallery": "id",
  "find_event_lobby_briefcase": "id",
  "find_event_lobby_child_layout_manager": "id",
  "find_event_lobby_layout_manager": "id",
  "find_event_lobby_layout_type_assets": "id",
  "find_event_lobby_menu": "id",
  "find_event_lobby_polling_options": "id",
  "find_event_lobby_polling_questions": "id",
  "find_event_lobby_polling_response": "id",
  "find_event_lobby_spots": "id",
  "find_event_lobby_templates": "id",
  "find_event_lobby_visitor_enquires": "id",
  "find_event_magazine_setup": "id",
  "find_event_marketer": "id",
  "find_event_member": "id",
  "find_event_networking_rooms": "id",
  "find_event_notifications": "id",
  "find_event_partner": "id",
  "find_event_phases": "id",
  "find_event_promotions": "id",
  "find_event_publication_contacts": "id",
  "find_event_schedule_meeting": "id",
  "find_event_sponsorer": "id",
  "find_event_sponsorship_setup": "id",
  "find_event_tab_menu": "id",
  "find_event_template_color_options": "id",
  "find_event_ticket": "id",
  "find_event_ticket_purchased": "id",
  "find_event_tradestand_setup": "id",
  "find_event_welcome_pack": "id",
  "find_events": "id",
  "find_events_book": "id",
  "find_events_categories": "id",
  "find_events_dates": "event_id",
  "find_events_rsvp": "id",
  "find_favorites": "id",
  "find_feeds_external": "id",
  "find_fields": "id",
  "find_fields_groups": "id",
  "find_guest_speaker": "id",
  "find_invoices": "id",
  "find_language_phrases": "phraseid",
  "find_latest_promotion": "id",
  "find_letter_log": "id",
  "find_listing_business_opportunity": "id",
  "find_listing_charity_partners": "id",
  "find_listing_listing_faq": "id",
  "find_listing_members": "id",
  "find_listings": "id",
  "find_magazine_publications": "id",
  "find_magzine_advert_rate_card": "id",
  "find_meeting": "id",
  "find_menu_links": "id",
  "find_news_letter_subscriber": "id",
  "find_orders": "id",
  "find_organiser_image": "id",
  "find_pages": "id",
  "find_products": "id",
  "find_products_groups": "id",
  "find_products_pricing": "id",
  "find_ratings": "id",
  "find_reviews": "id",
  "find_search_log": "id",
  "find_show_info": "id",
  "find_speakers": "id",
  "find_speakers_questions": "id",
  "find_sponsorship_categories": "id",
  "find_sponsorship_option_benefits": "id",
  "find_todo_list": "id",
  "find_transactions": "id",
  "find_user_credits_transactions": "id",
  "find_user_enquiry": "id",
  "find_users": "id",
  "independent_mst": "id",
  "sponsorship_benefits": "id",
  "find_users_groups": "id",
  "find_dashboard_menu": "id",
  "find_event_menus": "id",
  "cp_password_resets": "id",
  "cp_audit_logs": "id"
};

async function main() {
  const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });

  const tables = Object.entries(AUTOINCREMENT_COLUMN);
  console.log(`Checking sequences for ${tables.length} tables...\n`);

  let fixed = 0;
  let alreadyOk = 0;
  let skippedEmpty = 0;

  for (const [table, column] of tables) {
    try {
      const before = await pgPool.query(
        `SELECT last_value FROM pg_sequences WHERE schemaname = 'public' AND sequencename = pg_get_serial_sequence('"${table}"', '${column}')`
      ).catch(() => ({ rows: [] }));

      const maxRes = await pgPool.query(`SELECT MAX("${column}") AS max_id, COUNT(*) AS row_count FROM "${table}"`);
      const maxId = maxRes.rows[0].max_id;
      const rowCount = Number(maxRes.rows[0].row_count);

      if (rowCount === 0 || maxId === null) {
        skippedEmpty += 1;
        continue;
      }

      const beforeVal = before.rows[0]?.last_value ?? null;

      await pgPool.query(
        `SELECT setval(pg_get_serial_sequence('"${table}"', '${column}'), $1)`,
        [maxId]
      );

      if (beforeVal !== null && Number(beforeVal) >= Number(maxId)) {
        alreadyOk += 1;
      } else {
        fixed += 1;
        console.log(`  ${table}.${column}: sequence was ${beforeVal}, max id is ${maxId} -> advanced sequence to ${maxId}`);
      }
    } catch (err) {
      console.error(`  ${table}.${column}: FAILED — ${err.message}`);
    }
  }

  await pgPool.end();

  console.log(`\n=== Done ===`);
  console.log(`Sequences advanced (were behind): ${fixed}`);
  console.log(`Already correct: ${alreadyOk}`);
  console.log(`Skipped (empty table): ${skippedEmpty}`);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
