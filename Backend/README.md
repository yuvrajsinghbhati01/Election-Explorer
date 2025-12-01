# Election Explorer Backend

This is the backend for the Election Explorer application, which provides data and analysis for Indian Lok Sabha elections from 2004 to 2024.

## Features

- RESTful API for election data
- Data processing for constituency results
- Party performance analysis
- Comparative analysis of multiple parties
- State-wise election trends

## Technology Stack

- Python 3.9+
- Flask
- Pandas for data processing
- Plotly for data visualization

## API Endpoints

- `/api/years` - Get all available election years
- `/api/constituencies` - Get all constituencies
- `/api/parties` - Get all political parties
- `/api/constituency/<name>` - Get results for a specific constituency
- `/api/party/<name>` - Get performance data for a specific party
- `/api/compare/parties` - Compare multiple parties
- `/api/state-party-trends` - Get state-wise party trends

## Deployment

This backend is configured for deployment on Render.com. See the DEPLOYMENT.md file for detailed instructions.

## Local Development

1. Install dependencies: `pip install -r requirements.txt`
2. Run the development server: `python main.py`
3. The server will start at http://localhost:5000

## Data Sources

The application uses CSV data files stored in the `static/data` directory.
