// Isolated layout for /admin/login: intentionally minimal so the admin
// sidebar and the "sign in required" banner never render for
// signed-out users. Route groups keep the URL path unchanged.
export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
