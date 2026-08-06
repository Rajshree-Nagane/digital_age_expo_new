// Intentionally a pure passthrough. /members/index (login) and /members/user_index (post-login
// account home) must NOT go through the event auth gate or show EventAdminNavbar — only
// /members/user_event_summary and the event_* pages inside the (event) route group should.
// That gate + navbar live in ./(event)/layout.tsx, which only wraps those pages without adding
// a path segment to their URLs. Putting the gate here instead would block the login page itself
// (redirect loop) and would show the navbar on user_index, which is not what we want.
export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
