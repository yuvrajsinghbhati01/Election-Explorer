import os
import shutil
import glob

def copy_data_files():
    """
    Copy data files from the project's data directory to the static/data directory
    for deployment.
    """
    # Create static/data directory if it doesn't exist
    os.makedirs('static/data', exist_ok=True)
    
    # Get all CSV files in the data directory
    data_dir = '../data'
    csv_files = glob.glob(os.path.join(data_dir, '*.csv'))
    
    # Copy each file to static/data
    for file_path in csv_files:
        file_name = os.path.basename(file_path)
        dest_path = os.path.join('static/data', file_name)
        shutil.copy2(file_path, dest_path)
        print(f"Copied {file_path} to {dest_path}")

if __name__ == '__main__':
    copy_data_files()
