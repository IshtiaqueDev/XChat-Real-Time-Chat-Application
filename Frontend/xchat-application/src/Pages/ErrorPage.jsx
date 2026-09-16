function ErrorPage() {
  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <h1 className="display-1 fw-bold text-danger">404</h1>

        <h3 className="fw-semibold">Page Not Found</h3>

        <p className="text-muted">
          Sorry, the page you are looking for doesn't exist.
        </p>

        <a href="/" className="btn btn-dark px-4">
          Go Back Home
        </a>
      </div>
    </div>
  );
}

export default ErrorPage;
