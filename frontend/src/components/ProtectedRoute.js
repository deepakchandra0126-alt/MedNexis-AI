export function ProtectedRoute({ user, children, fallback = null }) {
  return user ? children : fallback;
}

export function AdminRoute({ user, children, fallback = null }) {
  return user?.role === 'admin' ? children : fallback;
}
