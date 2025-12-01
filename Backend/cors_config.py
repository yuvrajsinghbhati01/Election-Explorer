from flask_cors import CORS

def configure_cors(app):
    """
    Configure Cross-Origin Resource Sharing (CORS) for the Flask app.
    Update the allowed_origins list with your frontend domain when deployed.
    """
    allowed_origins = [
        'http://localhost:8000',        # Local development
        'http://localhost:3000',        # Another common local dev port
        'https://election-explorer.netlify.app',  # Netlify domain
        '*'  # Allow all origins during development (remove in production)
    ]

    # Apply CORS configuration
    CORS(app, resources={r"/*": {"origins": allowed_origins}})

    return app