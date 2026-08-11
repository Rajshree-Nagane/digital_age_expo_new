#!/usr/bin/env node
/**
 * One-time data migration: local MySQL (connectlocal_website) -> Neon Postgres (neondb).
 *
 * WHY THIS EXISTS
 * The .env was updated to point DATABASE_URL at Neon Postgres, but the app (schema.prisma,
 * package.json, src/lib/prisma.ts) was built for MySQL/MariaDB. Those files have already been
 * converted to Postgres. This script copies the actual ROWS from your local MySQL database into
 * the new (now-empty) Neon database, table by table, using the exact same table/column names —
 * Prisma's schema has zero @relation/foreign-key constraints, so tables can be copied in any
 * order without referential-integrity errors.
 *
 * PREREQUISITES (run these first, in order):
 *   1. npm install                     # picks up @prisma/adapter-pg + pg, drops the old mariadb adapter
 *   2. npx prisma generate             # regenerate the Prisma client against the new postgresql schema
 *   3. npx prisma db push              # creates all tables in the (empty) Neon database
 *   4. npm install --no-save mysql2    # one-time dependency just for THIS script; not added to package.json
 *   5. Make sure your local MySQL server is running and reachable at the DATABASE_URL below
 *      (127.0.0.1:3307 / connectlocal_website) — same connection this app used before.
 *
 * RUN:
 *   node migrate-to-neon.js
 *
 * The script is safe to re-run: each table is TRUNCATEd in Postgres before it's re-copied, so a
 * failed run can just be restarted after you fix whatever caused the failure.
 *
 * After it finishes, spot-check a few tables (row counts, a handful of real records) before
 * relying on the app against the migrated data.
 */

require("dotenv").config(); // plain `node script.js` doesn't auto-load .env the way Next.js does
const mysql = require("mysql2/promise");
const { Pool } = require("pg");

// ---- connection settings -----------------------------------------------------------------
const MYSQL_URL = process.env.OLD_MYSQL_URL || "mysql://root:Geecon0404@127.0.0.1:3307/connectlocal_website";
const PG_URL = process.env.DATABASE_URL; // read from .env — must already be the Neon URL

if (!PG_URL) {
  console.error("DATABASE_URL is not set (expected the Neon Postgres URL). Aborting.");
  process.exit(1);
}

// ---- every table Prisma manages, in the exact DB table name Prisma uses (no @@map divergence) --
const TABLES = [
  "common_type",
  "event_schedules",
  "find_advertise_books",
  "find_article",
  "find_banner_stands",
  "find_blog",
  "find_book_section_setting",
  "find_checklist_item_config",
  "find_classifieds",
  "find_domains",
  "find_email_log",
  "find_event_about_show",
  "find_event_advertisor",
  "find_event_checklists",
  "find_event_excluded",
  "find_event_exhibitor",
  "find_event_faqs_permission",
  "find_event_lobby_agenda",
  "find_event_lobby_agenda_items",
  "find_event_lobby_asset_gallery",
  "find_event_lobby_briefcase",
  "find_event_lobby_child_layout_manager",
  "find_event_lobby_layout_manager",
  "find_event_lobby_layout_type_assets",
  "find_event_lobby_menu",
  "find_event_lobby_polling_options",
  "find_event_lobby_polling_questions",
  "find_event_lobby_polling_response",
  "find_event_lobby_spots",
  "find_event_lobby_templates",
  "find_event_lobby_visitor_enquires",
  "find_event_magazine_setup",
  "find_event_marketer",
  "find_event_member",
  "find_event_networking_rooms",
  "find_event_notifications",
  "find_event_partner",
  "find_event_phases",
  "find_event_promotions",
  "find_event_publication_contacts",
  "find_event_schedule_meeting",
  "find_event_sponsorer",
  "find_event_sponsorship_setup",
  "find_event_tab_menu",
  "find_event_template_color_options",
  "find_event_ticket",
  "find_event_ticket_purchased",
  "find_event_tradestand_setup",
  "find_event_welcome_pack",
  "find_events",
  "find_events_book",
  "find_events_categories",
  "find_events_categories_lookup",
  "find_events_dates",
  "find_events_rsvp",
  "find_favorites",
  "find_feeds_external",
  "find_fields",
  "find_fields_groups",
  "find_guest_speaker",
  "find_invoices",
  "find_language_phrases",
  "find_latest_promotion",
  "find_letter_log",
  "find_listing_business_opportunity",
  "find_listing_charity_partners",
  "find_listing_listing_faq",
  "find_listing_members",
  "find_listings",
  "find_magazine_publications",
  "find_magzine_advert_rate_card",
  "find_meeting",
  "find_menu_links",
  "find_news_letter_subscriber",
  "find_orders",
  "find_organiser_image",
  "find_pages",
  "find_products",
  "find_products_groups",
  "find_products_pricing",
  "find_ratings",
  "find_reviews",
  "find_search_log",
  "find_show_info",
  "find_speakers",
  "find_speakers_questions",
  "find_sponsorship_categories",
  "find_sponsorship_option_benefits",
  "find_todo_list",
  "find_transactions",
  "find_user_credits_transactions",
  "find_user_enquiry",
  "find_users",
  "independent_mst",
  "sponsorship_benefits",
  "find_users_groups",
  "find_users_groups_lookup",
  "find_users_permissions",
  "find_users_groups_permissions_lookup",
  "find_settings",
  "find_dashboard_menu",
  "find_event_menus",
  "cp_password_resets",
  "cp_audit_logs",
  "find_email_templates"
];

// ---- tables with a single-column autoincrement primary key, and which column it is.
//      After copying explicit id values, the Postgres sequence backing that column has to be
//      bumped past the max copied id, or the next app-driven insert will collide on a reused id.
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

// Zero-date sentinel MySQL allows ('0000-00-00' / '0000-00-00 00:00:00') that Postgres rejects
// outright (there is no valid Postgres timestamp for it). Anything matching this gets remapped to
// the same 1970-01-01 epoch fallback used in the converted schema.prisma's @default(dbgenerated(...)).
const ZERO_DATE_RE = /^0000-00-00([ T]00:00:00)?$/;

// ---- Postgres enum columns -----------------------------------------------------------------
// MySQL never enforced these as real enums (they were just VARCHAR/ENUM columns with loose or no
// constraints), so legacy rows routinely contain "" or other stale values that the new Postgres
// enum type rejects outright. Rather than discover each one the slow way (a rejected 500-row
// batch silently falls back to row-by-row inserts — that's what made this crawl), values outside
// the enum's valid set are coerced up front: to the column's schema @default if it has one, else
// to null if the column is nullable, else (last resort, no safe target exists) to the enum's first
// value. Every coercion is counted and reported in the summary — nothing is silently dropped.
const ENUMS = {
  "sponsorship_benefits_benefit_type": [
    "before_the_event",
    "at_the_event",
    "judging_day",
    "after_the_event",
    "standard_benefit"
  ],
  "find_listings_status": [
    "active",
    "pending",
    "suspended",
    "unpublish",
    "deleted",
    "missing",
    "missed"
  ],
  "find_event_lobby_layout_manager_status": [
    "enabled",
    "disabled"
  ],
  "find_todo_list_status": [
    "success",
    "unsuccess",
    "deactive"
  ],
  "find_user_credits_transactions_type": [
    "paid",
    "receive"
  ],
  "sponsorship_benefits_status": [
    "enabled",
    "disabled"
  ],
  "find_feeds_external_type": [
    "external_feed",
    "internal_feed",
    "community_feed",
    "leadership_board",
    "people_in_business",
    "new_recruits"
  ],
  "find_speakers_questions_status": [
    "active",
    "pending",
    "reject"
  ],
  "find_event_promotions_status": [
    "active",
    "pending",
    "inactive"
  ],
  "find_banner_stands_status": [
    "active",
    "pending",
    "reject"
  ],
  "find_event_sponsorer_status": [
    "active",
    "pending",
    "excluded",
    "approved",
    "unapproved"
  ],
  "find_invoices_status": [
    "unpaid",
    "canceled",
    "paid"
  ],
  "find_event_advertisor_status": [
    "active",
    "pending",
    "inactive",
    "suspended",
    "excluded"
  ],
  "find_event_marketer_status": [
    "active",
    "pending",
    "inactive",
    "suspended",
    "excluded"
  ],
  "independent_mst_status": [
    "enabled",
    "disabled"
  ],
  "find_event_partner_status": [
    "active",
    "pending",
    "excluded"
  ],
  "find_invoices_discount_code_type": [
    "onetime",
    "recurring"
  ],
  "find_invoices_discount_code_discount_type": [
    "fixed",
    "percentage"
  ],
  "find_meeting_action_name": [
    "callback",
    "no_answer",
    "voicemail"
  ],
  "find_event_exhibitor_status": [
    "active",
    "pending",
    "excluded",
    "Interested",
    "Reserved",
    "Not Interested",
    "Unable to attend",
    "Call Back",
    "No Answer",
    "Invalid Number",
    "Voice Mail",
    "Meeting Scheduled"
  ],
  "find_orders_discount_code_type": [
    "onetime",
    "recurring"
  ],
  "find_orders_discount_code_discount_type": [
    "fixed",
    "percentage"
  ],
  "find_speakers_status": [
    "pending",
    "active",
    "reject"
  ],
  "find_events_check_eligibility_at": [
    "event",
    "application"
  ],
  "find_users_user_status": [
    "active",
    "deactive",
    "missing",
    "pending",
    "suspended"
  ],
  "find_events_rsvp_email_status": [
    "verified",
    "not verified",
    "blocked",
    "EMPTY_ENUM_VALUE"
  ],
  "find_event_phases_status": [
    "active",
    "pending",
    "EMPTY_ENUM_VALUE"
  ],
  "find_events_award_defalt_application_page": [
    "dashboard",
    "application",
    "EMPTY_ENUM_VALUE"
  ],
  "find_settings_optioncode_type": [
    "text",
    "textarea",
    "select",
    "radio",
    "checkbox",
    "file",
    "eval",
    "text_tags",
    "number_toggle"
  ],
  "find_settings_optioncode_parse_type": [
    "static",
    "eval_options",
    "eval"
  ]
};

const ENUM_COLUMNS = {
  "find_banner_stands": {
    "status": {
      "enum": "find_banner_stands_status",
      "nullable": true,
      "default": "active"
    }
  },
  "find_event_advertisor": {
    "status": {
      "enum": "find_event_advertisor_status",
      "nullable": true,
      "default": "active"
    }
  },
  "find_event_exhibitor": {
    "status": {
      "enum": "find_event_exhibitor_status",
      "nullable": false,
      "default": "pending"
    }
  },
  "find_event_lobby_layout_manager": {
    "status": {
      "enum": "find_event_lobby_layout_manager_status",
      "nullable": true,
      "default": null
    }
  },
  "find_event_marketer": {
    "status": {
      "enum": "find_event_marketer_status",
      "nullable": true,
      "default": "active"
    }
  },
  "find_event_partner": {
    "status": {
      "enum": "find_event_partner_status",
      "nullable": false,
      "default": "active"
    }
  },
  "find_event_phases": {
    "status": {
      "enum": "find_event_phases_status",
      "nullable": false,
      "default": null
    }
  },
  "find_event_promotions": {
    "status": {
      "enum": "find_event_promotions_status",
      "nullable": true,
      "default": "active"
    }
  },
  "find_event_sponsorer": {
    "status": {
      "enum": "find_event_sponsorer_status",
      "nullable": true,
      "default": "active"
    }
  },
  "find_events": {
    "award_defalt_application_page": {
      "enum": "find_events_award_defalt_application_page",
      "nullable": true,
      "default": null
    },
    "check_eligibility_at": {
      "enum": "find_events_check_eligibility_at",
      "nullable": true,
      "default": "event"
    }
  },
  "find_events_rsvp": {
    "email_status": {
      "enum": "find_events_rsvp_email_status",
      "nullable": true,
      "default": null
    }
  },
  "find_feeds_external": {
    "type": {
      "enum": "find_feeds_external_type",
      "nullable": false,
      "default": "external_feed"
    }
  },
  "find_invoices": {
    "status": {
      "enum": "find_invoices_status",
      "nullable": true,
      "default": "unpaid"
    },
    "discount_code_type": {
      "enum": "find_invoices_discount_code_type",
      "nullable": true,
      "default": null
    },
    "discount_code_discount_type": {
      "enum": "find_invoices_discount_code_discount_type",
      "nullable": true,
      "default": null
    }
  },
  "find_listings": {
    "status": {
      "enum": "find_listings_status",
      "nullable": false,
      "default": "active"
    }
  },
  "find_meeting": {
    "action_name": {
      "enum": "find_meeting_action_name",
      "nullable": true,
      "default": null
    }
  },
  "find_orders": {
    "discount_code_type": {
      "enum": "find_orders_discount_code_type",
      "nullable": true,
      "default": null
    },
    "discount_code_discount_type": {
      "enum": "find_orders_discount_code_discount_type",
      "nullable": true,
      "default": null
    }
  },
  "find_speakers": {
    "status": {
      "enum": "find_speakers_status",
      "nullable": false,
      "default": "pending"
    }
  },
  "find_speakers_questions": {
    "status": {
      "enum": "find_speakers_questions_status",
      "nullable": false,
      "default": "active"
    }
  },
  "find_todo_list": {
    "status": {
      "enum": "find_todo_list_status",
      "nullable": false,
      "default": "unsuccess"
    }
  },
  "find_user_credits_transactions": {
    "type": {
      "enum": "find_user_credits_transactions_type",
      "nullable": false,
      "default": null
    }
  },
  "find_users": {
    "user_status": {
      "enum": "find_users_user_status",
      "nullable": false,
      "default": "active"
    }
  },
  "independent_mst": {
    "status": {
      "enum": "independent_mst_status",
      "nullable": false,
      "default": "enabled"
    }
  },
  "sponsorship_benefits": {
    "benefit_type": {
      "enum": "sponsorship_benefits_benefit_type",
      "nullable": true,
      "default": null
    },
    "status": {
      "enum": "sponsorship_benefits_status",
      "nullable": false,
      "default": "enabled"
    }
  },
  "find_settings": {
    "optioncode_type": {
      "enum": "find_settings_optioncode_type",
      "nullable": false,
      "default": null
    },
    "optioncode_parse_type": {
      "enum": "find_settings_optioncode_parse_type",
      "nullable": false,
      "default": null
    }
  }
};

function cleanValue(v) {
  if (v === undefined) return null;
  if (Buffer.isBuffer(v)) {
    // MySQL BIT(n) columns (only is_static in this schema) come back as a Buffer — treat as boolean.
    return v.length > 0 && (v[0] & 1) === 1;
  }
  if (typeof v === "string" && ZERO_DATE_RE.test(v.trim())) {
    return "1970-01-01 00:00:00";
  }
  return v;
}

/**
 * Coerces a single column's raw MySQL value to something the target Postgres enum will accept.
 * Returns { value, coerced } — coerced is true when the original value had to be replaced.
 */
function coerceEnumValue(table, column, value) {
  const info = ENUM_COLUMNS[table] && ENUM_COLUMNS[table][column];
  if (!info) return { value, coerced: false };

  const validValues = ENUMS[info.enum] || [];
  if (value !== null && value !== undefined && validValues.includes(value)) {
    return { value, coerced: false };
  }

  if (info.default && validValues.includes(info.default)) {
    return { value: info.default, coerced: true };
  }
  if (info.nullable) {
    return { value: null, coerced: true };
  }
  // No default, not nullable — no safe target exists. Fall back to the enum's first value so the
  // row isn't lost, but this table/column combo is worth a manual look afterward.
  return { value: validValues[0] ?? null, coerced: true };
}

async function migrateTable(mysqlConn, pgPool, table) {
  const [rows] = await mysqlConn.query(`SELECT * FROM \`${table}\``);
  if (rows.length === 0) {
    await pgPool.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    console.log(`  ${table}: 0 rows (nothing to copy)`);
    return { table, rows: 0, errors: 0, coercions: 0 };
  }

  const columns = Object.keys(rows[0]);
  const quotedCols = columns.map((c) => `"${c}"`).join(", ");
  const enumCols = ENUM_COLUMNS[table] || {};

  await pgPool.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);

  const BATCH_SIZE = 500;
  let inserted = 0;
  let errors = 0;
  let coercions = 0;
  const coercionSamples = new Set();

  function prepareRow(row) {
    return columns.map((c) => {
      let v = cleanValue(row[c]);
      if (enumCols[c]) {
        const { value, coerced } = coerceEnumValue(table, c, v);
        if (coerced) {
          coercions += 1;
          coercionSamples.add(`${c}: ${JSON.stringify(v)} -> ${JSON.stringify(value)}`);
        }
        v = value;
      }
      return v;
    });
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = batch.map((row, rowIdx) => {
      const rowValues = prepareRow(row);
      const rowPlaceholders = rowValues.map((_, colIdx) => {
        values.push(rowValues[colIdx]);
        return `$${rowIdx * columns.length + colIdx + 1}`;
      });
      return `(${rowPlaceholders.join(", ")})`;
    });
    const sql = `INSERT INTO "${table}" (${quotedCols}) VALUES ${placeholders.join(", ")}`;
    try {
      await pgPool.query(sql, values);
      inserted += batch.length;
    } catch (batchErr) {
      // Fall back to row-by-row so one bad row doesn't sink the whole batch — log and continue.
      for (const row of batch) {
        const rowValues = prepareRow(row);
        const rowPlaceholders = rowValues.map((_, idx) => `$${idx + 1}`).join(", ");
        try {
          await pgPool.query(`INSERT INTO "${table}" (${quotedCols}) VALUES (${rowPlaceholders})`, rowValues);
          inserted += 1;
        } catch (rowErr) {
          errors += 1;
          console.error(`  ${table}: failed to insert row (pk-ish values: ${JSON.stringify(row[columns[0]])}): ${rowErr.message}`);
        }
      }
    }
  }

  const autoincCol = AUTOINCREMENT_COLUMN[table];
  if (autoincCol) {
    await pgPool.query(
      `SELECT setval(pg_get_serial_sequence('"${table}"', '${autoincCol}'), COALESCE((SELECT MAX("${autoincCol}") FROM "${table}"), 1))`
    );
  }

  const coercionNote = coercions
    ? `, ${coercions} enum value(s) coerced (${[...coercionSamples].slice(0, 3).join("; ")}${coercionSamples.size > 3 ? "; ..." : ""})`
    : "";
  console.log(`  ${table}: ${inserted}/${rows.length} rows copied${errors ? `, ${errors} FAILED` : ""}${coercionNote}`);
  return { table, rows: inserted, errors, coercions };
}

async function main() {
  console.log("Connecting to source MySQL:", MYSQL_URL.replace(/:[^:@]*@/, ":****@"));
  const mysqlConn = await mysql.createConnection({ uri: MYSQL_URL, dateStrings: true });

  console.log("Connecting to target Neon Postgres...");
  const pgPool = new Pool({ connectionString: PG_URL });

  const summary = [];
  console.log(`\nMigrating ${TABLES.length} tables...\n`);
  for (const table of TABLES) {
    try {
      const result = await migrateTable(mysqlConn, pgPool, table);
      summary.push(result);
    } catch (err) {
      console.error(`  ${table}: TABLE FAILED — ${err.message}`);
      summary.push({ table, rows: 0, errors: -1, tableFailed: true });
    }
  }

  await mysqlConn.end();
  await pgPool.end();

  console.log("\n=== Migration summary ===");
  const totalRows = summary.reduce((a, s) => a + s.rows, 0);
  const totalErrors = summary.reduce((a, s) => a + (s.errors > 0 ? s.errors : 0), 0);
  const failedTables = summary.filter((s) => s.tableFailed).map((s) => s.table);
  const tablesWithRowErrors = summary.filter((s) => s.errors > 0).map((s) => s.table);
  console.log(`Total rows copied: ${totalRows}`);
  console.log(`Total row-level errors: ${totalErrors}`);
  if (failedTables.length) console.log(`Tables that failed entirely: ${failedTables.join(", ")}`);
  if (tablesWithRowErrors.length) console.log(`Tables with some failed rows: ${tablesWithRowErrors.join(", ")}`);
  if (!failedTables.length && !tablesWithRowErrors.length) console.log("No errors. ✅");
}

main().catch((err) => {
  console.error("Migration aborted:", err);
  process.exit(1);
});
