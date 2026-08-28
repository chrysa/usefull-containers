import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="p-6">
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/">Go back home</Link>
    </div>
  );
}
