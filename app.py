from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import random
from scipy.sparse import load_npz

app = Flask(__name__, static_folder='static', template_folder='templates')

# Helper function to check if file exists and is readable
def safe_file_exists(file_path):
    """Check if a file exists and is accessible."""
    try:
        return os.path.isfile(file_path) and os.access(file_path, os.R_OK)
    except:
        return False

# Load movies data
@app.route('/')
def index():
    return render_template('index.html')

# Load models and data
def load_models():
    print("Loading recommendation models...")
    models = {}
    
    try:
        # Define paths to model files using absolute paths
        base_dir = os.path.dirname(__file__)
        models_dir = os.path.join(base_dir, 'models')
        data_dir = os.path.join(base_dir, 'data')
        
        # Load movie data
        movies_path = os.path.join(data_dir, 'movies2024.csv')
        print(f"Loading movies from: {movies_path}")
        if safe_file_exists(movies_path):
            movies_df = pd.read_csv(movies_path)
            models['movies_df'] = movies_df
        else:
            print(f"Warning: Movie data file not found at {movies_path}")
            return models
        
        # Load TF-IDF vectorizer
        tfidf_path = os.path.join(models_dir, 'tfidf_vectorizer.pkl')
        if safe_file_exists(tfidf_path):
            with open(tfidf_path, 'rb') as f:
                models['tfidf'] = pickle.load(f)
        
        # Load user and movie features
        user_features_path = os.path.join(models_dir, 'user_features.npy')
        if safe_file_exists(user_features_path):
            models['user_features'] = np.load(user_features_path)
        
        movie_features_path = os.path.join(models_dir, 'movie_features.npy')
        if safe_file_exists(movie_features_path):
            models['movie_features'] = np.load(movie_features_path)
        
        # Load the sparse TF-IDF matrix
        tfidf_matrix_path = os.path.join(models_dir, 'tfidf_matrix.npz')
        if safe_file_exists(tfidf_matrix_path):
            models['tfidf_matrix'] = load_npz(tfidf_matrix_path)
        
        # Load the sample similarity matrix and indices
        cosine_sim_path = os.path.join(models_dir, 'cosine_sim_sample.npy')
        if safe_file_exists(cosine_sim_path):
            models['cosine_sim_sample'] = np.load(cosine_sim_path)
        
        sample_indices_path = os.path.join(models_dir, 'sample_indices.npy')
        if safe_file_exists(sample_indices_path):
            models['sample_indices'] = np.load(sample_indices_path)
        
        # Load genre encoder
        genre_mlb_path = os.path.join(models_dir, 'genre_mlb.pkl')
        if safe_file_exists(genre_mlb_path):
            with open(genre_mlb_path, 'rb') as f:
                models['genre_mlb'] = pickle.load(f)
        
        print("Models loaded successfully!")
        return models
    except Exception as e:
        print(f"Error loading models: {e}")
        # For demonstration, return empty dict with just movies_df if available
        try:
            movies_path = os.path.join(os.path.dirname(__file__), 'data', 'movies2024.csv')
            if safe_file_exists(movies_path):
                movies_df = pd.read_csv(movies_path)
                return {'movies_df': movies_df}
        except Exception as e:
            print(f"Error loading movie data: {e}")
        return {}

# Global variable to store models
models = load_models()

# Helper function to classify movie region
def classify_movie_region(movie_row):
    """
    Classify movies into regional cinema categories based on available information
    """
    title = str(movie_row['Title']).lower()
    actors = str(movie_row['Actors']).lower() if 'Actors' in movie_row else ""
    directors = str(movie_row['Directors']).lower() if 'Directors' in movie_row else ""
    overview = str(movie_row['Overview']).lower() if 'Overview' in movie_row else ""
    
    # Combined text for analysis
    combined_text = f"{title} {actors} {directors} {overview}"
    
    # Define keywords/patterns for different regional cinemas
    bollywood_patterns = ['bollywood', 'hindi', 'india', 'indian', 'mumbai', 'khan', 'kapoor', 'chopra', 'johar', 'bhatt']
    tollywood_patterns = ['telugu', 'tollywood', 'hyderabad', 'andhra', 'telangana', 'rajamouli', 'prabhas', 'allu', 'chiranjeevi']
    kollywood_patterns = ['tamil', 'kollywood', 'chennai', 'rajinikanth', 'vijay', 'ajith']
    
    # Check for regional cinema markers
    for pattern in bollywood_patterns:
        if pattern in combined_text:
            return "Bollywood"
            
    for pattern in tollywood_patterns:
        if pattern in combined_text:
            return "Tollywood"
            
    for pattern in kollywood_patterns:
        if pattern in combined_text:
            return "Kollywood"
            
    # Default to Hollywood (Western cinema) if no other patterns match
    return "Hollywood"

# Apply regional classification if not present
def prepare_movies_df():
    global models
    movies_df = models.get('movies_df')
    
    if movies_df is None:
        return None
    
    # Add region classification if needed
    if 'Region' not in movies_df.columns:
        print("Classifying movies by regional cinema...")
        movies_df['Region'] = movies_df.apply(classify_movie_region, axis=1)
    
    return movies_df

# API endpoint to get recommendations
@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    user_preferences = request.json
    print("Received user preferences:", user_preferences)
    
    movies_df = prepare_movies_df()
    if movies_df is None:
        return jsonify({'error': 'Movie data not available'}), 500
    
    # Extract user preferences
    recommendation_type = user_preferences.get('recommendationType', '')
    sub_type = user_preferences.get('subType', '')
    genres = user_preferences.get('genre', [])
    if isinstance(genres, str):
        genres = [genres]
    time_period = user_preferences.get('timePeriod', 'any')
    rating_preference = user_preferences.get('rating', 'any-rating')
    popularity_preference = user_preferences.get('popularity', 'any')
    
    # Pre-filter movies based on common criteria
    filtered_movies = movies_df.copy()
    
    # Apply time period filter
    if time_period == 'classic':
        filtered_movies = filtered_movies[filtered_movies['ReleaseYear'] < 2000]
    elif time_period == 'modern':
        filtered_movies = filtered_movies[(filtered_movies['ReleaseYear'] >= 2000) & 
                                         (filtered_movies['ReleaseYear'] < 2020)]
    elif time_period == 'recent':
        filtered_movies = filtered_movies[filtered_movies['ReleaseYear'] >= 2020]
    
    # Apply rating filter
    if rating_preference == 'high-rated':
        filtered_movies = filtered_movies[filtered_movies['VoteAverage'] >= 7.0]
    
    # Apply popularity filter
    if popularity_preference == 'popular':
        filtered_movies = filtered_movies[filtered_movies['Popularity'] > 30]
    elif popularity_preference == 'lesser-known':
        filtered_movies = filtered_movies[filtered_movies['Popularity'] <= 30]
    
    # Apply genre filter if it's not 'any'
    if genres and 'any' not in genres:
        # Create a filter for movies containing any of the selected genres
        genre_filter = filtered_movies['Genres'].str.contains('|'.join(genres), na=False)
        filtered_movies = filtered_movies[genre_filter]
    
    # Handle each recommendation type
    recommendations = []
    
    try:
        if recommendation_type == 'content':
            recommendations = get_content_based_recommendations(filtered_movies, sub_type)
        elif recommendation_type == 'mood':
            recommendations = get_mood_based_recommendations(filtered_movies, sub_type)
        elif recommendation_type == 'discovery':
            recommendations = get_discovery_recommendations(filtered_movies, sub_type)
        elif recommendation_type == 'regional':
            recommendations = get_regional_recommendations(filtered_movies, sub_type)
        else:
            # Fallback to basic recommendations
            recommendations = get_basic_recommendations(filtered_movies)
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        recommendations = get_basic_recommendations(filtered_movies)
    
    return jsonify(recommendations)

# Content-based recommendations
def get_content_based_recommendations(filtered_movies, sub_type, num_recommendations=6):
    global models
    
    try:
        # Use the sample similarity matrix if available
        if 'cosine_sim_sample' in models and 'sample_indices' in models:
            # Get a random movie as reference
            # In a real app, we'd use a movie selected by the user
            if len(filtered_movies) == 0:
                return []
                
            reference_idx = random.randint(0, len(filtered_movies) - 1)
            reference_movie_id = filtered_movies.iloc[reference_idx]['MovieID']
            
            # Find this movie in the sample indices
            sample_indices = models['sample_indices']
            cosine_sim_sample = models['cosine_sim_sample']
            
            # Check if this movie is in the sample indices
            if reference_movie_id in sample_indices:
                sample_idx = np.where(sample_indices == reference_movie_id)[0][0]
                
                # Get similarity scores for this movie
                sim_scores = list(enumerate(cosine_sim_sample[sample_idx]))
                sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
                
                # Get top similar movie indices (excluding the reference movie)
                top_indices = [sample_indices[i[0]] for i in sim_scores if i[0] != sample_idx][:20]
                
                # Get top similar movies
                top_movies = models['movies_df'][models['movies_df']['MovieID'].isin(top_indices)]
                
                # Filter based on previously applied criteria
                top_movies = top_movies[top_movies['MovieID'].isin(filtered_movies['MovieID'])]
                
                # Take top N recommendations
                top_recommendations = top_movies.head(num_recommendations)
                
                # Format recommendations for frontend
                recommendations = format_recommendations(top_recommendations)
                
                return recommendations
            
        # If we can't use the sample similarity matrix, compute similarities on demand
        if 'tfidf_matrix' in models:
            if len(filtered_movies) == 0:
                return []
                
            # Select a random movie as reference
            reference_idx = random.randint(0, len(filtered_movies) - 1)
            reference_movie = filtered_movies.iloc[reference_idx]
            
            # Get the corresponding index in the original dataset
            reference_id = reference_movie['MovieID']
            original_idx = models['movies_df'][models['movies_df']['MovieID'] == reference_id].index
            
            if len(original_idx) == 0:
                return get_basic_recommendations(filtered_movies)
                
            original_idx = original_idx[0]
            
            # Use TF-IDF similarity
            movie_vec = models['tfidf_matrix'][original_idx:original_idx+1]
            
            # Calculate similarity with all other movies
            sims = cosine_similarity(movie_vec, models['tfidf_matrix']).flatten()
            
            # Get indices of top similar movies
            sim_indices = sims.argsort()[::-1][1:21]  # Top 20 most similar, excluding self
            
            # Get original MovieIDs for these indices
            sim_movies = models['movies_df'].iloc[sim_indices]
            
            # Filter based on previously applied criteria
            sim_movies = sim_movies[sim_movies['MovieID'].isin(filtered_movies['MovieID'])]
            
            # Take top N recommendations
            top_recommendations = sim_movies.head(num_recommendations)
            
            # Format recommendations for frontend
            recommendations = format_recommendations(top_recommendations)
            
            return recommendations
        
        # Fallback to basic recommendations if needed
        return get_basic_recommendations(filtered_movies)
        
    except Exception as e:
        print(f"Error in content-based recommendations: {e}")
        return get_basic_recommendations(filtered_movies)

# Mood-based recommendations
def get_mood_based_recommendations(filtered_movies, mood, num_recommendations=6):
    # Map moods to genres
    mood_genres = {
        'happy': ['Comedy', 'Animation', 'Family', 'Adventure'],
        'sad': ['Drama', 'Romance', 'Music'],
        'excited': ['Action', 'Adventure', 'Science Fiction', 'Fantasy'],
        'relaxed': ['Documentary', 'History', 'TV Movie'],
        'thoughtful': ['Drama', 'History', 'Documentary', 'War'],
        'romantic': ['Romance', 'Comedy', 'Drama']
    }
    
    try:
        # Get genres corresponding to the mood
        mood_related_genres = mood_genres.get(mood, ['Comedy', 'Drama', 'Action'])
        
        # Filter movies containing any of the mood-related genres
        mood_filter = filtered_movies['Genres'].str.contains('|'.join(mood_related_genres), na=False)
        mood_movies = filtered_movies[mood_filter]
        
        # Sort by rating and get top recommendations
        mood_recommendations = mood_movies.sort_values('VoteAverage', ascending=False).head(num_recommendations)
        
        # Format recommendations for frontend
        recommendations = format_recommendations(mood_recommendations)
        
        return recommendations
    except Exception as e:
        print(f"Error in mood-based recommendations: {e}")
        return get_basic_recommendations(filtered_movies)

# Discovery recommendations
def get_discovery_recommendations(filtered_movies, discovery_type, num_recommendations=6):
    try:
        discovery_movies = filtered_movies.copy()
        
        if discovery_type == 'hidden':
            # Hidden gems: high-rated but lesser-known
            discovery_movies = discovery_movies[
                (discovery_movies['Popularity'] < 30) &
                (discovery_movies['VoteAverage'] >= 7.0)
            ]
            # Calculate gem score
            discovery_movies['SpecialScore'] = (
                (discovery_movies['VoteAverage'] - 7.0) / 3 +  # Rating component
                (1 - (discovery_movies['Popularity'] / 30))  # Popularity component
            )
            discovery_movies = discovery_movies.sort_values('SpecialScore', ascending=False)
            
        elif discovery_type == 'underrated':
            # Underrated: decent rating but lower popularity
            discovery_movies = discovery_movies[
                (discovery_movies['Popularity'] < 50) &
                (discovery_movies['VoteAverage'] >= 6.5)
            ]
            # Calculate underrated score
            discovery_movies['SpecialScore'] = (
                discovery_movies['VoteAverage'] / 10 *
                (1 - (discovery_movies['Popularity'] / 100))
            )
            discovery_movies = discovery_movies.sort_values('SpecialScore', ascending=False)
            
        elif discovery_type == 'cult':
            # Cult classics: older movies with passionate followings
            discovery_movies = discovery_movies[
                (discovery_movies['ReleaseYear'] < 2010) &
                (discovery_movies['VoteAverage'] >= 7.0)
            ]
            # Calculate cult score
            discovery_movies['SpecialScore'] = (
                discovery_movies['VoteAverage'] / 10 *
                (1 - (discovery_movies['ReleaseYear'] / 2025))
            )
            discovery_movies = discovery_movies.sort_values('SpecialScore', ascending=False)
            
        elif discovery_type == 'awards':
            # Award winners (proxy: high ratings)
            discovery_movies = discovery_movies[discovery_movies['VoteAverage'] >= 8.0]
            discovery_movies = discovery_movies.sort_values('VoteAverage', ascending=False)
        
        # Get top recommendations
        top_discoveries = discovery_movies.head(num_recommendations)
        
        # Format recommendations for frontend
        recommendations = format_recommendations(top_discoveries)
        
        return recommendations
    except Exception as e:
        print(f"Error in discovery recommendations: {e}")
        return get_basic_recommendations(filtered_movies)

# Regional recommendations
def get_regional_recommendations(filtered_movies, region, num_recommendations=6):
    try:
        # Filter by selected region
        regional_movies = filtered_movies[filtered_movies['Region'] == region]
        
        # Sort by rating and get top recommendations
        top_regional = regional_movies.sort_values('VoteAverage', ascending=False).head(num_recommendations)
        
        # Format recommendations for frontend
        recommendations = format_recommendations(top_regional)
        
        return recommendations
    except Exception as e:
        print(f"Error in regional recommendations: {e}")
        return get_basic_recommendations(filtered_movies)

# Basic recommendations (fallback)
def get_basic_recommendations(filtered_movies, num_recommendations=6):
    try:
        # Sort by popularity and rating
        top_movies = filtered_movies.sort_values(['VoteAverage', 'Popularity'], ascending=[False, False])
        
        # Take top N recommendations
        top_recommendations = top_movies.head(num_recommendations)
        
        # Format recommendations for frontend
        recommendations = format_recommendations(top_recommendations)
        
        return recommendations
    except Exception as e:
        print(f"Error in basic recommendations: {e}")
        # Return an empty list if all else fails
        return []

# Helper function to format recommendations for frontend
def format_recommendations(movies_df):
    recommendations = []
    
    for _, movie in movies_df.iterrows():
        # Extract and format genres
        genres = []
        if isinstance(movie['Genres'], str):
            genres = movie['Genres'].split('|')
        
        # Create recommendation object
        recommendation = {
            'title': movie['Title'],
            'genres': genres,
            'year': int(movie['ReleaseYear']) if 'ReleaseYear' in movie and not pd.isna(movie['ReleaseYear']) else 0,
            'rating': float(movie['VoteAverage']) if 'VoteAverage' in movie and not pd.isna(movie['VoteAverage']) else 0.0,
            'overview': movie['Overview'] if 'Overview' in movie else "",
            'region': movie['Region'] if 'Region' in movie else "Hollywood",
            'posterPath': os.path.join('/static', 'img', 'no-poster.jpg')
        }
        
        recommendations.append(recommendation)
    
    return recommendations

# Serve static files from the static folder
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    # Make sure the required directories exist
    base_dir = os.path.dirname(__file__)
    os.makedirs(os.path.join(base_dir, 'static', 'img'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'models'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'data'), exist_ok=True)
    
    # Start the Flask app with port from environment (for Render)
    if os.environ.get('RENDER') == 'true':
    # Production on Render
        port = int(os.environ.get('PORT', 5000))
        app.run(host='0.0.0.0', port=port)
    else:
    # Local development
        app.run(debug=True, port=5000)