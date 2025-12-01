import os
import pandas as pd
import numpy as np
import logging
from typing import Dict, List, Any, Optional, Union

class DataProcessor:
    """
    Processes Lok Sabha election data from CSV files.
    """

    def __init__(self):
        """
        Initialize the DataProcessor class by loading data from CSV files.
        """
        self.logger = logging.getLogger(__name__)
        self.data_by_year = {}
        self.years = []

        # Load data
        try:
            # Define the expected CSV files for different years
            csv_files = {
                '1952': 'lok_sabha_1952_data.csv',
                '1957': 'lok_sabha_1957_data.csv',
                '1962': 'lok_sabha_1962_data.csv',
                '1967': 'lok_sabha_1967_data.csv',
                '1971': 'lok_sabha_1971_data.csv',
                '1977': 'lok_sabha_1977_data.csv',
                '1980': 'lok_sabha_1980_data.csv',
                '1984': 'lok_sabha_1984_data.csv',
                '1989': 'lok_sabha_1989_data.csv',
                '1991': 'lok_sabha_1991_data.csv',
                '1996': 'lok_sabha_1996_data.csv',
                '1998': 'lok_sabha_1998_data.csv',
                '1999': 'lok_sabha_1999_data.csv',
                '2004': 'lok_sabha_2004_data.csv',
                '2009': 'lok_sabha_2009_data.csv',
                '2014': 'lok_sabha_2014_data.csv',
                '2019': 'lok_sabha_2019_data.csv',
                '2024': 'lok_sabha_2024_data.csv'
            }

            # Try different possible data directories
            possible_data_dirs = [
                '../data',                  # Relative to backend directory
                'data',                     # In the root directory
                'static/data',              # Static directory for deployment
                os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'data'),  # Absolute path to static/data
                os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')  # Absolute path to project root/data
            ]

            # Load each CSV file
            for year, file_name in csv_files.items():
                file_found = False

                for data_dir in possible_data_dirs:
                    file_path = os.path.join(data_dir, file_name)

                    if os.path.exists(file_path):
                        self.logger.info(f"Loading data for year {year} from {file_path}")
                        df = pd.read_csv(file_path, skiprows=0)

                        # Clean column names
                        df.columns = [col.strip() for col in df.columns]

                        # Store the data
                        self.data_by_year[year] = df
                        self.years.append(year)
                        file_found = True
                        break

                if not file_found:
                    self.logger.warning(f"File {file_name} not found in any data directory. Skipping data for year {year}.")

            # Sort years chronologically
            self.years.sort()

            self.logger.info(f"Loaded data for {len(self.years)} years: {', '.join(self.years)}")

            # Process and cache data
            self._process_data()

        except Exception as e:
            self.logger.error(f"Error initializing DataProcessor: {str(e)}")
            raise

    def _process_data(self):
        """
        Process the loaded data to extract useful information.
        """
        try:
            # Initialize containers
            self.constituencies = set()
            self.parties = set()
            self.states = set()

            # Extract unique constituencies, parties, and states
            for year, df in self.data_by_year.items():
                if 'PC Name' in df.columns:
                    self.constituencies.update(df['PC Name'].unique())

                if 'Party' in df.columns:
                    self.parties.update(df['Party'].unique())

                if 'State' in df.columns:
                    self.states.update(df['State'].unique())

            # Convert to sorted lists
            self.constituencies = sorted(list(self.constituencies))
            self.parties = sorted(list(self.parties))
            self.states = sorted(list(self.states))

            self.logger.info(f"Processed data: {len(self.constituencies)} constituencies, {len(self.parties)} parties")

        except Exception as e:
            self.logger.error(f"Error in _process_data: {str(e)}")
            raise

    def get_years(self) -> List[str]:
        """
        Get the available election years.

        Returns:
            List[str]: List of election years
        """
        return self.years

    def get_constituencies(self) -> List[str]:
        """
        Get the list of all constituencies.

        Returns:
            List[str]: List of constituency names
        """
        return self.constituencies

    def get_parties(self) -> List[str]:
        """
        Get the list of all parties.

        Returns:
            List[str]: List of party names
        """
        return self.parties

    def get_states(self) -> List[str]:
        """
        Get the list of all states.

        Returns:
            List[str]: List of state names
        """
        states = set()
        for year, df in self.data_by_year.items():
            if 'State' in df.columns:
                states.update(df['State'].unique())
        return sorted(list(states))

    def get_election_data(self, year: str) -> Dict[str, Any]:
        """
        Get data for a specific election year.

        Args:
            year (str): The election year

        Returns:
            Dict[str, Any]: Election data
        """
        if year not in self.data_by_year:
            return {'error': f'No data available for year {year}'}

        df = self.data_by_year[year]

        # Calculate party-wise seat count
        party_seats = df['Party'].value_counts().to_dict()

        # Get total turnout
        try:
            avg_turnout = df['Turnout'].str.rstrip('%').astype(float).mean()
        except:
            avg_turnout = None

        # Get data by constituency
        constituencies_data = []

        for _, row in df.iterrows():
            constituency_data = {
                'constituency': row.get('PC Name', ''),
                'state': row.get('State', ''),
                'winner': row.get('Winning Candidate', ''),
                'party': row.get('Party', ''),
                'margin_percent': row.get('Margin %', '')
            }

            if 'Votes' in row and 'Electors' in row:
                try:
                    votes = int(str(row['Votes']).replace(',', ''))
                    electors = int(str(row['Electors']).replace(',', ''))
                    constituency_data['votes'] = votes
                    constituency_data['electors'] = electors
                except:
                    pass

            constituencies_data.append(constituency_data)

        return {
            'year': year,
            'party_seats': party_seats,
            'constituencies': constituencies_data,
            'avg_turnout': avg_turnout
        }

    def get_constituency_data(self, name: str) -> Dict[str, Any]:
        """
        Get data for a specific constituency across all years.

        Args:
            name (str): The constituency name

        Returns:
            Dict[str, Any]: Constituency data
        """
        constituency_data = {'name': name, 'results': []}

        for year in self.years:
            df = self.data_by_year[year]
            constituency_rows = df[df['PC Name'] == name]

            if not constituency_rows.empty:
                row = constituency_rows.iloc[0]

                result = {
                    'year': year,
                    'winner': row.get('Winning Candidate', ''),
                    'party': row.get('Party', ''),
                    'votes': row.get('Votes', ''),
                    'margin': row.get('Margin', ''),
                    'margin_percent': row.get('Margin %', ''),
                    'turnout': row.get('Turnout', '')
                }

                constituency_data['results'].append(result)

        return constituency_data

    def get_party_data(self, name: str) -> Dict[str, Any]:
        """
        Get data for a specific party across all years.

        Args:
            name (str): The party name

        Returns:
            Dict[str, Any]: Party data
        """
        party_data = {'name': name, 'performance': []}

        for year in self.years:
            df = self.data_by_year[year]
            party_rows = df[df['Party'] == name]

            if not party_rows.empty:
                seats_won = len(party_rows)
                total_seats = len(df)

                performance = {
                    'year': year,
                    'seats_won': seats_won,
                    'total_seats': total_seats,
                    'percentage': round((seats_won / total_seats) * 100, 2)
                }

                # Get list of constituencies won
                constituencies = []
                for _, row in party_rows.iterrows():
                    constituency = {
                        'name': row.get('PC Name', ''),
                        'winner': row.get('Winning Candidate', ''),
                        'margin_percent': row.get('Margin %', '')
                    }
                    constituencies.append(constituency)

                performance['constituencies'] = constituencies
                party_data['performance'].append(performance)
            else:
                # Party didn't win any seats that year
                party_data['performance'].append({
                    'year': year,
                    'seats_won': 0,
                    'total_seats': len(df),
                    'percentage': 0,
                    'constituencies': []
                })

        return party_data

    def compare_years(self, years: List[str]) -> Dict[str, Any]:
        """
        Compare election results between different years.

        Args:
            years (List[str]): List of years to compare

        Returns:
            Dict[str, Any]: Comparison data
        """
        if not all(year in self.years for year in years):
            return {'error': 'One or more specified years not found in data'}

        comparison = {'years': years, 'party_performance': {}, 'turnout_comparison': []}

        # Get top parties across all the years
        top_parties = set()
        for year in years:
            df = self.data_by_year[year]
            # Get top 5 parties by seat count
            year_top_parties = df['Party'].value_counts().head(10).index.tolist()
            top_parties.update(year_top_parties)

        # For each party, get seats won in each year
        for party in top_parties:
            party_data = []
            for year in years:
                df = self.data_by_year[year]
                seats = len(df[df['Party'] == party])
                party_data.append({'year': year, 'seats': seats})
            comparison['party_performance'][party] = party_data

        # Compare turnout
        for year in years:
            df = self.data_by_year[year]
            try:
                avg_turnout = df['Turnout'].str.rstrip('%').astype(float).mean()
                comparison['turnout_comparison'].append({
                    'year': year,
                    'avg_turnout': avg_turnout
                })
            except:
                comparison['turnout_comparison'].append({
                    'year': year,
                    'avg_turnout': None
                })

        return comparison

    def compare_parties(self, parties: List[str]) -> Dict[str, Any]:
        """
        Compare performance of different parties across all years.

        Args:
            parties (List[str]): List of parties to compare

        Returns:
            Dict[str, Any]: Comparison data
        """
        comparison = {'parties': parties, 'data': []}

        for year in self.years:
            df = self.data_by_year[year]
            year_data = {'year': year, 'party_seats': {}}

            for party in parties:
                seats = len(df[df['Party'] == party])
                year_data['party_seats'][party] = seats

            comparison['data'].append(year_data)

        return comparison

    def get_turnout_data(self) -> Dict[str, Any]:
        """
        Get voter turnout data across all years.

        Returns:
            Dict[str, Any]: Turnout data
        """
        turnout_data = {'years': [], 'avg_turnout': [], 'state_turnout': {}}

        for year in self.years:
            df = self.data_by_year[year]
            try:
                turnout_column = df['Turnout'].str.rstrip('%').astype(float)
                avg_turnout = turnout_column.mean()

                turnout_data['years'].append(year)
                turnout_data['avg_turnout'].append(avg_turnout)

                # State-wise turnout
                if 'State' in df.columns:
                    state_turnout = df.groupby('State')['Turnout'].apply(
                        lambda x: x.str.rstrip('%').astype(float).mean()
                    ).to_dict()

                    for state, turnout in state_turnout.items():
                        if state not in turnout_data['state_turnout']:
                            turnout_data['state_turnout'][state] = []

                        # Find the position for this year
                        year_index = turnout_data['years'].index(year)

                        # Make sure the list has enough elements
                        while len(turnout_data['state_turnout'][state]) <= year_index:
                            turnout_data['state_turnout'][state].append(None)

                        turnout_data['state_turnout'][state][year_index] = turnout
            except Exception as e:
                self.logger.warning(f"Error processing turnout data for {year}: {str(e)}")

        return turnout_data

    def get_win_margin_data(self) -> Dict[str, Any]:
        """
        Get winning margin data across all years.

        Returns:
            Dict[str, Any]: Win margin data
        """
        margin_data = {'years': [], 'avg_margin': [], 'close_contests': [], 'landslide_wins': []}

        for year in self.years:
            df = self.data_by_year[year]
            try:
                margin_column = None
                if 'Margin %' in df.columns:
                    # Try to convert to numeric, removing any % signs
                    margin_column = pd.to_numeric(df['Margin %'].str.rstrip('%'), errors='coerce')

                if margin_column is not None:
                    avg_margin = margin_column.mean()
                    margin_data['years'].append(year)
                    margin_data['avg_margin'].append(avg_margin)

                    # Close contests (margin < 1%)
                    close = df[margin_column < 1].shape[0]
                    margin_data['close_contests'].append(close)

                    # Landslide wins (margin > 20%)
                    landslide = df[margin_column > 20].shape[0]
                    margin_data['landslide_wins'].append(landslide)
            except Exception as e:
                self.logger.warning(f"Error processing margin data for {year}: {str(e)}")

        return margin_data

    def search(self, query: str) -> Dict[str, Any]:
        """
        Search for constituencies, candidates, or parties.

        Args:
            query (str): The search query

        Returns:
            Dict[str, Any]: Search results
        """
        results = {
            'constituencies': [],
            'candidates': [],
            'parties': []
        }

        query = query.lower()

        # Search constituencies
        matching_constituencies = [c for c in self.constituencies if query in c.lower()]
        results['constituencies'] = matching_constituencies[:10]  # Limit to top 10

        # Search candidates and parties across all dataframes
        candidates = set()
        parties = set()

        for year, df in self.data_by_year.items():
            if 'Winning Candidate' in df.columns:
                matching_candidates = df[df['Winning Candidate'].str.lower().str.contains(query, na=False)]
                for _, row in matching_candidates.iterrows():
                    candidates.add(row['Winning Candidate'])

            if 'Party' in df.columns:
                matching_parties = df[df['Party'].str.lower().str.contains(query, na=False)]
                for _, row in matching_parties.iterrows():
                    parties.add(row['Party'])

        results['candidates'] = list(candidates)[:10]  # Limit to top 10
        results['parties'] = list(parties)[:10]  # Limit to top 10

        return results

    def get_party_trends(self) -> Dict[str, Any]:
        """
        Get trends for major parties across all years.

        Returns:
            Dict[str, Any]: Party trends data
        """
        # Identify major parties (those that won seats in multiple elections)
        party_year_count = {}

        for year, df in self.data_by_year.items():
            parties_with_seats = df['Party'].unique()
            for party in parties_with_seats:
                if party not in party_year_count:
                    party_year_count[party] = 0
                party_year_count[party] += 1

        # Consider parties that won seats in at least 2 elections
        major_parties = [party for party, count in party_year_count.items() if count >= 2]

        # Get trend data for these parties
        trends = {'years': self.years, 'parties': major_parties, 'seat_trends': {}}

        for party in major_parties:
            seat_data = []

            for year in self.years:
                df = self.data_by_year[year]
                seats = len(df[df['Party'] == party])
                seat_data.append(seats)

            trends['seat_trends'][party] = seat_data

        return trends

    def get_all_states_data(self) -> Dict[str, Any]:
        """
        Get data for all states across all years.

        Returns:
            Dict[str, Any]: State-wise data
        """
        state_data = {'states': self.states, 'years': self.years, 'data': {}}

        for state in self.states:
            state_data['data'][state] = self.get_state_data(state)

        return state_data

    def get_state_data(self, state: str) -> Dict[str, Any]:
        """
        Get data for a specific state across all years.

        Args:
            state (str): The state name

        Returns:
            Dict[str, Any]: State data
        """
        state_data = {'state': state, 'years': [], 'party_seats': {}, 'turnout': []}

        for year in self.years:
            df = self.data_by_year[year]

            if 'State' in df.columns:
                state_rows = df[df['State'] == state]

                if not state_rows.empty:
                    state_data['years'].append(year)

                    # Party-wise seat count for this state in this year
                    party_seats = state_rows['Party'].value_counts().to_dict()

                    for party, seats in party_seats.items():
                        if party not in state_data['party_seats']:
                            state_data['party_seats'][party] = [0] * len(state_data['years'])

                        # Fill in seats for this year
                        year_index = state_data['years'].index(year)

                        # Make sure the list has enough elements
                        while len(state_data['party_seats'][party]) <= year_index:
                            state_data['party_seats'][party].append(0)

                        state_data['party_seats'][party][year_index] = seats

                    # Average turnout for this state in this year
                    try:
                        turnout = state_rows['Turnout'].str.rstrip('%').astype(float).mean()
                        state_data['turnout'].append(turnout)
                    except:
                        state_data['turnout'].append(None)

        return state_data

    def get_state_party_trends(self, state: str, party: str = '') -> Dict[str, Any]:
        """
        Get party-wise trend data for a specific state.

        Args:
            state (str): The state name
            party (str, optional): Specific party to filter, or empty for all parties

        Returns:
            Dict[str, Any]: State party trends data
        """
        trend_data = {
            'state': state,
            'years': [],
            'parties': [],
            'seat_trends': {},
            'vote_share_trends': {}
        }

        # Identify parties active in this state
        parties_in_state = set()
        for year in self.years:
            df = self.data_by_year[year]

            if 'State' in df.columns:
                state_rows = df[df['State'] == state]

                if not state_rows.empty:
                    trend_data['years'].append(year)
                    state_parties = state_rows['Party'].unique()
                    parties_in_state.update(state_parties)

        # If specific party requested, filter to just that party
        if party and party in parties_in_state:
            active_parties = [party]
        else:
            # Otherwise get all active parties (for UI selection)
            active_parties = sorted(list(parties_in_state))

        trend_data['parties'] = active_parties

        # Get seat trends for each party in this state
        for party_name in active_parties:
            seat_data = []
            vote_share_data = []

            for year in trend_data['years']:
                df = self.data_by_year[year]
                state_rows = df[df['State'] == state]

                if not state_rows.empty:
                    # Calculate seats won by this party in this state
                    party_rows = state_rows[state_rows['Party'] == party_name]
                    seats = len(party_rows)
                    seat_data.append(seats)

                    # Calculate vote share if possible
                    if 'Votes' in df.columns:
                        try:
                            party_votes = party_rows['Votes'].str.replace(',', '').astype(int).sum()
                            total_votes = state_rows['Votes'].str.replace(',', '').astype(int).sum()
                            vote_share = (party_votes / total_votes * 100) if total_votes > 0 else 0
                            vote_share_data.append(round(vote_share, 2))
                        except:
                            vote_share_data.append(0)
                    else:
                        vote_share_data.append(0)
                else:
                    seat_data.append(0)
                    vote_share_data.append(0)

            trend_data['seat_trends'][party_name] = seat_data
            trend_data['vote_share_trends'][party_name] = vote_share_data

        return trend_data

    def get_constituency_type_data(self, constituency_type: str = '') -> Dict[str, Any]:
        """
        Get data for different constituency types (General, SC, ST).

        Args:
            constituency_type (str, optional): Filter to specific type or empty for all types

        Returns:
            Dict[str, Any]: Constituency type analysis data
        """
        type_data = {'years': self.years, 'types': [], 'data': {}}

        # Find all constituency types in the data
        constituency_types = set()
        for year, df in self.data_by_year.items():
            if 'Type' in df.columns:
                types = df['Type'].unique()
                constituency_types.update(types)

        # Convert to list and sort
        all_types = sorted(list(constituency_types))

        # Filter to specific type if requested
        if constituency_type and constituency_type in all_types:
            selected_types = [constituency_type]
        else:
            selected_types = all_types

        type_data['types'] = selected_types

        # For each type, get data across years
        for ctype in selected_types:
            type_data['data'][ctype] = {
                'seats_by_year': [],
                'party_performance': {},
                'turnout_by_year': []
            }

            for year in self.years:
                df = self.data_by_year[year]

                if 'Type' in df.columns:
                    type_rows = df[df['Type'] == ctype]

                    # Number of seats of this type in this year
                    seats = len(type_rows)
                    type_data['data'][ctype]['seats_by_year'].append(seats)

                    # Party performance in this constituency type
                    if not type_rows.empty:
                        party_seats = type_rows['Party'].value_counts().to_dict()

                        for party, count in party_seats.items():
                            if party not in type_data['data'][ctype]['party_performance']:
                                type_data['data'][ctype]['party_performance'][party] = [0] * len(self.years)

                            # Update party performance for this year
                            year_index = self.years.index(year)
                            type_data['data'][ctype]['party_performance'][party][year_index] = count

                        # Average turnout for this constituency type
                        if 'Turnout' in type_rows.columns:
                            try:
                                turnout = type_rows['Turnout'].str.rstrip('%').astype(float).mean()
                                type_data['data'][ctype]['turnout_by_year'].append(round(turnout, 2))
                            except:
                                type_data['data'][ctype]['turnout_by_year'].append(None)
                        else:
                            type_data['data'][ctype]['turnout_by_year'].append(None)
                    else:
                        type_data['data'][ctype]['turnout_by_year'].append(None)
                else:
                    type_data['data'][ctype]['seats_by_year'].append(0)
                    type_data['data'][ctype]['turnout_by_year'].append(None)

        return type_data
