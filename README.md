# Movie MatchMaker - Personalized Movie Recommendation System

![Movie MatchMaker](static/img/no-poster.jpg))

## Live Demo
🎬 **[Try Movie MatchMaker Here](https://movie-matchmaker-recommendation-system.onrender.com/)**

> **Note:** This application is deployed on Render's free tier, which causes the service to become inactive after periods of no traffic. If you're accessing the site for the first time or after a period of inactivity, it may take 30-60 seconds to spin up. Thank you for your patience!

## Overview
Movie MatchMaker is an AI-powered movie recommendation system that delivers personalized movie suggestions based on user preferences, mood, and viewing history. The system uses machine learning algorithms to analyze movie features and provide tailored recommendations.

## Features
- **Content-based Recommendations**: Suggests movies similar to ones you already like
- **Mood-based Recommendations**: Matches movies to your current emotional state
- **Discovery Mode**: Find hidden gems, underrated movies, and cult classics
- **Regional Cinema**: Explore movies from different film industries (Hollywood, Bollywood, etc.)
- **Multiple Filtering Options**: Filter by genre, rating, time period, and popularity
- **Responsive UI**: Works on desktop and mobile devices

## Technology Stack
- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript
- **Data Science**: NumPy, Pandas, Scikit-learn
- **Recommendation Algorithms**: TF-IDF, Cosine Similarity
- **Deployment**: Render

## Project Structure
```
movie_match_maker/
│
├── app.py                   # Flask application entry point
├── data/
│   └── movies2024.csv       # Movie dataset
├── models/                  # Machine learning models
│   ├── cosine_sim_sample.npy
│   ├── genre_mlb.pkl
│   ├── movie_features.npy
│   ├── sample_indices.npy
│   ├── tfidf_matrix.npz
│   ├── tfidf_vectorizer.pkl
│   └── user_features.npy
├── requirements.txt         # Dependencies
├── static/
│   ├── css/
│   │   └── style.css        # CSS styles
│   ├── img/                 # Images and posters
│   └── js/
│       └── app.js           # Frontend JavaScript
└── templates/
    └── index.html           # Main HTML template
```

## Deployment Process
The application is deployed on Render with the following configuration:
1. Connected GitHub repository to Render
2. Configured as a Web Service with Python runtime
3. Set the build command to `pip install -r requirements.txt`
4. Set the start command to `gunicorn app:app`
5. Ensured proper file path handling for deployment environment

## Development Journey
This project was developed as part of a final project for an AI course. The development process involved:

1. **Understanding User Needs**: Conducted surveys to understand movie preferences and frustrations with existing recommendation systems
2. **Data Collection & Preprocessing**: Used a comprehensive movie dataset and applied cleaning and feature extraction
3. **Model Development**: Implemented TF-IDF and cosine similarity for content-based filtering
4. **UI Design & Integration**: Created an intuitive interface for capturing preferences and displaying recommendations
5. **Testing & Refinement**: Tested with users and refined based on feedback
6. **Deployment**: Deployed to Render for public access

## Running Locally
To run this project locally:

1. Clone the repository
   ```
   git clone https://github.com/yourusername/movie-matchmaker.git
   cd movie-matchmaker
   ```

2. Create a virtual environment and install dependencies
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Run the application
   ```
   python app.py
   ```

4. Open your browser and navigate to `http://localhost:5000`

## Future Enhancements
- Implement user accounts and preferences storage
- Add collaborative filtering for improved recommendations
- Integrate with streaming platforms to show content availability
- Enhance the recommendation algorithm with deep learning approaches
- Add more regional cinema categories

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Dataset inspired by TMDB and other movie databases
- Special thanks to all survey participants for providing valuable insights
- Built with the guidance of AI course instructor, **Professor Paige Rodeghero** 
