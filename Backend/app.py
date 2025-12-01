import os
import logging
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from data_processor import DataProcessor
from cors_config import configure_cors

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__, static_folder='../frontend', static_url_path='/')
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key_for_development")

# Add a static route for data files
app.config['DATA_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'data')

# Enable CORS with proper configuration for deployment
app = configure_cors(app)

# Initialize data processor
try:
    data_processor = DataProcessor()
except Exception as e:
    app.logger.error(f"Error initializing DataProcessor: {str(e)}")
    # Create a minimal data processor that will return empty data
    data_processor = DataProcessor()

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_frontend(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/data/<path:filename>')
def serve_data(filename):
    """Serve data files from the static/data directory"""
    return send_from_directory(app.config['DATA_FOLDER'], filename)

@app.route('/api')
def api_index():
    return jsonify({
        'message': 'Lok Sabha Elections API',
        'version': '1.0',
        'endpoints': [
            '/api/years',
            '/api/constituencies',
            '/api/parties',
            '/api/election/<year>',
            '/api/constituency/<name>',
            '/api/party/<name>',
            '/api/compare/years',
            '/api/compare/parties',
            '/api/turnout'
        ]
    })

@app.route('/api/years')
def get_years():
    return jsonify(data_processor.get_years())

@app.route('/api/constituencies')
def get_constituencies():
    return jsonify(data_processor.get_constituencies())

@app.route('/api/parties')
def get_parties():
    return jsonify(data_processor.get_parties())

@app.route('/api/states')
def get_states():
    return jsonify(data_processor.get_states())

@app.route('/api/election/<year>')
def get_election_data(year):
    return jsonify(data_processor.get_election_data(year))

@app.route('/api/constituency/<name>')
def get_constituency_data(name):
    return jsonify(data_processor.get_constituency_data(name))

@app.route('/api/party/<name>')
def get_party_data(name):
    return jsonify(data_processor.get_party_data(name))

@app.route('/api/compare/years')
def compare_years():
    years = request.args.getlist('years')
    if not years:
        return jsonify({'error': 'No years specified'}), 400
    return jsonify(data_processor.compare_years(years))

@app.route('/api/compare/parties')
def compare_parties():
    parties = request.args.getlist('parties')
    if not parties:
        return jsonify({'error': 'No parties specified'}), 400
    return jsonify(data_processor.compare_parties(parties))

@app.route('/api/turnout')
def get_turnout_data():
    return jsonify(data_processor.get_turnout_data())

@app.route('/api/winmargin')
def get_win_margin_data():
    return jsonify(data_processor.get_win_margin_data())

@app.route('/api/search')
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'No search query provided'}), 400
    return jsonify(data_processor.search(query))

@app.route('/api/party-trends')
def party_trends():
    return jsonify(data_processor.get_party_trends())

@app.route('/api/state-analysis')
def state_analysis():
    state = request.args.get('state', '')
    if not state:
        return jsonify(data_processor.get_all_states_data())
    return jsonify(data_processor.get_state_data(state))

@app.route('/api/state-party-trends')
def state_party_trends():
    """Get party trends specific to a state"""
    state = request.args.get('state', '')
    party = request.args.get('party', '')

    if not state:
        return jsonify({'error': 'State parameter is required'}), 400

    return jsonify(data_processor.get_state_party_trends(state, party))

@app.route('/api/constituency-types')
def constituency_types():
    """Get data for different constituency types (General, SC, ST)"""
    constituency_type = request.args.get('type', '')
    return jsonify(data_processor.get_constituency_type_data(constituency_type))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)