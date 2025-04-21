// Wait for DOM to be fully loaded before running any code
document.addEventListener('DOMContentLoaded', function() {
    // Global variables to store user preferences
    const userPreferences = {
        recommendationType: '',
        subType: '',
        genre: [],
        timePeriod: 'any',
        rating: 'any-rating',
        popularity: 'any'
    };

    // Sample genres for initial population
    const allGenres = [
        { value: 'Action', icon: 'fas fa-running' },
        { value: 'Adventure', icon: 'fas fa-compass' },
        { value: 'Animation', icon: 'fas fa-child' },
        { value: 'Comedy', icon: 'fas fa-laugh' },
        { value: 'Crime', icon: 'fas fa-fingerprint' },
        { value: 'Documentary', icon: 'fas fa-film' },
        { value: 'Drama', icon: 'fas fa-theater-masks' },
        { value: 'Family', icon: 'fas fa-users' },
        { value: 'Fantasy', icon: 'fas fa-dragon' },
        { value: 'History', icon: 'fas fa-landmark' },
        { value: 'Horror', icon: 'fas fa-ghost' },
        { value: 'Music', icon: 'fas fa-music' },
        { value: 'Mystery', icon: 'fas fa-question-circle' },
        { value: 'Romance', icon: 'fas fa-heart' },
        { value: 'Science Fiction', icon: 'fas fa-robot' },
        { value: 'Thriller', icon: 'fas fa-mask' },
        { value: 'War', icon: 'fas fa-fighter-jet' },
        { value: 'Western', icon: 'fas fa-hat-cowboy' }
    ];

    // DOM Elements
    const progressBar = document.getElementById('progress-bar');
    const progressSteps = [
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3'),
        document.getElementById('step-4')
    ];

    // Step containers
    const step1Container = document.getElementById('step1-container');
    const step2ContentContainer = document.getElementById('step2-content');
    const step2MoodContainer = document.getElementById('step2-mood');
    const step2DiscoveryContainer = document.getElementById('step2-discovery');
    const step2RegionalContainer = document.getElementById('step2-regional');
    const step3GenreContainer = document.getElementById('step3-genre');
    const step4PreferencesContainer = document.getElementById('step4-preferences');
    const recommendationsContainer = document.getElementById('recommendations-results');
    const loadingRecommendations = document.getElementById('loading-recommendations');

    // Navigation buttons
    const step1NextBtn = document.getElementById('step1-next');
    const step2ContentBackBtn = document.getElementById('step2-content-back');
    const step2ContentNextBtn = document.getElementById('step2-content-next');
    const step2MoodBackBtn = document.getElementById('step2-mood-back');
    const step2MoodNextBtn = document.getElementById('step2-mood-next');
    const step2DiscoveryBackBtn = document.getElementById('step2-discovery-back');
    const step2DiscoveryNextBtn = document.getElementById('step2-discovery-next');
    const step2RegionalBackBtn = document.getElementById('step2-regional-back');
    const step2RegionalNextBtn = document.getElementById('step2-regional-next');
    const step3BackBtn = document.getElementById('step3-back');
    const step3NextBtn = document.getElementById('step3-next');
    const step4BackBtn = document.getElementById('step4-back');
    const getRecommendationsBtn = document.getElementById('get-recommendations');
    const startOverBtn = document.getElementById('start-over');
    const refinePreferencesBtn = document.getElementById('refine-preferences');

    // Function to update progress bar
    function updateProgress(step) {
        if (!progressBar) return;
        
        const progressPercentage = (step - 1) * 33.3;
        progressBar.style.width = progressPercentage + '%';
        
        // Update step indicators
        if (!progressSteps || progressSteps.some(step => !step)) return;
        
        progressSteps.forEach((stepEl, index) => {
            if (index + 1 < step) {
                stepEl.classList.remove('active');
                stepEl.classList.add('completed');
            } else if (index + 1 === step) {
                stepEl.classList.add('active');
                stepEl.classList.remove('completed');
            } else {
                stepEl.classList.remove('active', 'completed');
            }
        });
    }

    // Function to show a specific step
    function showStep(stepContainer) {
        if (!stepContainer) {
            console.error('Step container not found');
            return;
        }
        
        // Hide all steps
        const allSteps = document.querySelectorAll('.steps-container');
        if (allSteps) {
            allSteps.forEach(container => {
                container.classList.remove('active');
            });
        }
        
        // Show the requested step
        stepContainer.classList.add('active');
    }

    // Function to select an option in the grid
    function setupSelectionCards(container, multiSelect = false) {
        if (!container) {
            console.error('Container element not found');
            return;
        }
        
        const cards = container.querySelectorAll('.selection-card');
        if (!cards || cards.length === 0) {
            console.error('No selection cards found in container');
            return;
        }
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                if (multiSelect) {
                    card.classList.toggle('selected');
                } else {
                    // Deselect all cards in this container
                    container.querySelectorAll('.selection-card').forEach(c => {
                        c.classList.remove('selected');
                    });
                    card.classList.add('selected');
                }
            });
        });
    }

    // Setup selection cards for all steps with proper error checking
    if (step1Container) {
        setupSelectionCards(step1Container);
    }
    
    if (step2ContentContainer) {
        setupSelectionCards(step2ContentContainer);
    }
    
    if (step2MoodContainer) {
        setupSelectionCards(step2MoodContainer);
    }
    
    if (step2DiscoveryContainer) {
        setupSelectionCards(step2DiscoveryContainer);
    }
    
    if (step2RegionalContainer) {
        setupSelectionCards(step2RegionalContainer);
    }
    
    if (step3GenreContainer) {
        setupSelectionCards(step3GenreContainer, true); // Allow multi-select for genres
    }
    
    if (step4PreferencesContainer) {
        const formGroups = step4PreferencesContainer.querySelectorAll('.form-group');
        if (formGroups && formGroups.length > 2) {
            setupSelectionCards(formGroups[1]); // Rating preferences
            setupSelectionCards(formGroups[2]); // Popularity preferences
        }
    }

    // Populate genre grid
    function populateGenreGrid() {
        const genreGrid = document.getElementById('genre-grid');
        if (!genreGrid) {
            console.error('Genre grid element not found');
            return;
        }
        
        genreGrid.innerHTML = ''; // Clear existing content
        
        allGenres.forEach(genre => {
            const genreCard = document.createElement('div');
            genreCard.className = 'selection-card';
            genreCard.dataset.value = genre.value;
            genreCard.innerHTML = `
                <i class="${genre.icon}"></i>
                <h3>${genre.value}</h3>
            `;
            genreGrid.appendChild(genreCard);
        });
        
        // Add "Any genre" option
        const anyGenreCard = document.createElement('div');
        anyGenreCard.className = 'selection-card';
        anyGenreCard.dataset.value = 'any';
        anyGenreCard.innerHTML = `
            <i class="fas fa-random"></i>
            <h3>Any genre</h3>
            <p>I'm open to anything</p>
        `;
        genreGrid.appendChild(anyGenreCard);
        
        // Setup selection functionality
        setupSelectionCards(genreGrid, true);
    }

    // Call once to populate initially
    if (document.getElementById('genre-grid')) {
        populateGenreGrid();
    }

    // Function to get selected value from a container
    function getSelectedValue(container, multiSelect = false) {
        if (!container) {
            console.error('Container element not found');
            return multiSelect ? [] : '';
        }
        
        const selectedCards = container.querySelectorAll('.selection-card.selected');
        
        if (selectedCards.length === 0) return multiSelect ? [] : '';
        
        if (multiSelect) {
            return Array.from(selectedCards).map(card => card.dataset.value);
        } else {
            return selectedCards[0].dataset.value;
        }
    }

    // Function to fetch recommendations from backend
    async function fetchRecommendations(preferences) {
        try {
            const response = await fetch('/api/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(preferences)
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch recommendations');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            throw error;
        }
    }

    // Function to display recommendations
    function displayRecommendations(movies) {
        const recommendationsContainer = document.getElementById('recommendations-container');
        if (!recommendationsContainer) {
            console.error('Recommendations container not found');
            return;
        }
        
        recommendationsContainer.innerHTML = ''; // Clear existing content
        
        if (!movies || movies.length === 0) {
            recommendationsContainer.innerHTML = '<p class="text-center">No recommendations found matching your criteria. Try adjusting your preferences.</p>';
            return;
        }
        
        movies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            
            // Create genre tags HTML
            const genreTagsHTML = Array.isArray(movie.genres) 
                ? movie.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('') 
                : '';
            
            // Format genres with commas for meta section
            const genresFormatted = Array.isArray(movie.genres) ? movie.genres.join(', ') : '';
            
            // Get poster path or use placeholder
            const posterPath = movie.posterPath || '/static/img/no-poster.jpg';
            
            movieCard.innerHTML = `
                <div class="movie-poster">
                    <img src="${posterPath}" alt="${movie.title}">
                    <div class="movie-rating">
                        <i class="fas fa-star"></i>
                        ${movie.rating.toFixed(1)}
                    </div>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <div class="movie-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${movie.year}</span>
                        <span><i class="fas fa-globe"></i> ${movie.region || 'Hollywood'}</span>
                    </div>
                    <div class="movie-genres">
                        ${genreTagsHTML}
                    </div>
                    <p class="movie-overview">${movie.overview}</p>
                    <div class="movie-actions">
                        <button class="watch-btn">
                            <i class="fas fa-play"></i>
                            Watch Now
                        </button>
                        <button class="bookmark-btn">
                            <i class="far fa-bookmark"></i>
                        </button>
                    </div>
                </div>
            `;
            
            recommendationsContainer.appendChild(movieCard);
        });
        
        // Hide loading indicator
        if (loadingRecommendations) {
            loadingRecommendations.style.display = 'none';
        }
    }

    // Event listeners for navigation - only add if elements exist
    
    // Step 1 to Step 2
    if (step1NextBtn) {
        step1NextBtn.addEventListener('click', () => {
            if (!step1Container) return;
            
            const selectedType = getSelectedValue(step1Container);
            
            if (!selectedType) {
                alert('Please select a recommendation type');
                return;
            }
            
            userPreferences.recommendationType = selectedType;
            updateProgress(2);
            
            // Show appropriate step 2 based on selection
            if (selectedType === 'content' && step2ContentContainer) {
                showStep(step2ContentContainer);
            } else if (selectedType === 'mood' && step2MoodContainer) {
                showStep(step2MoodContainer);
            } else if (selectedType === 'discovery' && step2DiscoveryContainer) {
                showStep(step2DiscoveryContainer);
            } else if (selectedType === 'regional' && step2RegionalContainer) {
                showStep(step2RegionalContainer);
            }
        });
    }

    // Content-based navigation
    if (step2ContentBackBtn) {
        step2ContentBackBtn.addEventListener('click', () => {
            if (!step1Container) return;
            
            updateProgress(1);
            showStep(step1Container);
        });
    }

    if (step2ContentNextBtn) {
        step2ContentNextBtn.addEventListener('click', () => {
            if (!step2ContentContainer || !step3GenreContainer) return;
            
            const selectedSubType = getSelectedValue(step2ContentContainer);
            
            if (!selectedSubType) {
                alert('Please select an option');
                return;
            }
            
            userPreferences.subType = selectedSubType;
            updateProgress(3);
            showStep(step3GenreContainer);
        });
    }

    // Mood-based navigation
    if (step2MoodBackBtn) {
        step2MoodBackBtn.addEventListener('click', () => {
            if (!step1Container) return;
            
            updateProgress(1);
            showStep(step1Container);
        });
    }

    if (step2MoodNextBtn) {
        step2MoodNextBtn.addEventListener('click', () => {
            if (!step2MoodContainer || !step3GenreContainer) return;
            
            const selectedMood = getSelectedValue(step2MoodContainer);
            
            if (!selectedMood) {
                alert('Please select your mood');
                return;
            }
            
            userPreferences.subType = selectedMood;
            updateProgress(3);
            showStep(step3GenreContainer);
        });
    }

    // Discovery navigation
    if (step2DiscoveryBackBtn) {
        step2DiscoveryBackBtn.addEventListener('click', () => {
            if (!step1Container) return;
            
            updateProgress(1);
            showStep(step1Container);
        });
    }

    if (step2DiscoveryNextBtn) {
        step2DiscoveryNextBtn.addEventListener('click', () => {
            if (!step2DiscoveryContainer || !step3GenreContainer) return;
            
            const selectedDiscovery = getSelectedValue(step2DiscoveryContainer);
            
            if (!selectedDiscovery) {
                alert('Please select a discovery type');
                return;
            }
            
            userPreferences.subType = selectedDiscovery;
            updateProgress(3);
            showStep(step3GenreContainer);
        });
    }

    // Regional cinema navigation
    if (step2RegionalBackBtn) {
        step2RegionalBackBtn.addEventListener('click', () => {
            if (!step1Container) return;
            
            updateProgress(1);
            showStep(step1Container);
        });
    }

    if (step2RegionalNextBtn) {
        step2RegionalNextBtn.addEventListener('click', () => {
            if (!step2RegionalContainer || !step3GenreContainer) return;
            
            const selectedRegion = getSelectedValue(step2RegionalContainer);
            
            if (!selectedRegion) {
                alert('Please select a region');
                return;
            }
            
            userPreferences.subType = selectedRegion;
            updateProgress(3);
            showStep(step3GenreContainer);
        });
    }

    // Step 3 navigation
    if (step3BackBtn) {
        step3BackBtn.addEventListener('click', () => {
            updateProgress(2);
            
            // Return to the appropriate step 2
            if (userPreferences.recommendationType === 'content' && step2ContentContainer) {
                showStep(step2ContentContainer);
            } else if (userPreferences.recommendationType === 'mood' && step2MoodContainer) {
                showStep(step2MoodContainer);
            } else if (userPreferences.recommendationType === 'discovery' && step2DiscoveryContainer) {
                showStep(step2DiscoveryContainer);
            } else if (userPreferences.recommendationType === 'regional' && step2RegionalContainer) {
                showStep(step2RegionalContainer);
            }
        });
    }

    if (step3NextBtn) {
        step3NextBtn.addEventListener('click', () => {
            if (!step3GenreContainer || !step4PreferencesContainer) return;
            
            const selectedGenres = getSelectedValue(step3GenreContainer, true);
            
            if (selectedGenres.length === 0) {
                alert('Please select at least one genre');
                return;
            }
            
            userPreferences.genre = selectedGenres;
            updateProgress(4);
            showStep(step4PreferencesContainer);
        });
    }

    // Step 4 navigation
    if (step4BackBtn) {
        step4BackBtn.addEventListener('click', () => {
            if (!step3GenreContainer) return;
            
            updateProgress(3);
            showStep(step3GenreContainer);
        });
    }

    // Get recommendations
    if (getRecommendationsBtn) {
        getRecommendationsBtn.addEventListener('click', async () => {
            const timePeriodElement = document.getElementById('time-period');
            if (timePeriodElement) {
                userPreferences.timePeriod = timePeriodElement.value;
            }
            
            if (step4PreferencesContainer) {
                const formGroups = step4PreferencesContainer.querySelectorAll('.form-group');
                if (formGroups && formGroups.length > 2) {
                    userPreferences.rating = getSelectedValue(formGroups[1]) || 'any-rating';
                    userPreferences.popularity = getSelectedValue(formGroups[2]) || 'any';
                }
            }
            
            // Log for debugging
            console.log('User Preferences:', userPreferences);
            
            // Show recommendations section
            if (recommendationsContainer) {
                showStep(recommendationsContainer);
            }
            
            // Show loading indicator
            if (loadingRecommendations) {
                loadingRecommendations.style.display = 'block';
            }
            
            try {
                // Get recommendations from backend
                const recommendations = await fetchRecommendations(userPreferences);
                displayRecommendations(recommendations);
            } catch (error) {
                console.error('Error getting recommendations:', error);
                if (loadingRecommendations) {
                    loadingRecommendations.innerHTML = '<p>Sorry, there was an error getting your recommendations. Please try again.</p>';
                }
            }
        });
    }

    // Navigation buttons for recommendations page
    if (startOverBtn) {
        startOverBtn.addEventListener('click', () => {
            if (!step1Container) return;
            
            updateProgress(1);
            showStep(step1Container);
        });
    }

    if (refinePreferencesBtn) {
        refinePreferencesBtn.addEventListener('click', () => {
            if (!step4PreferencesContainer) return;
            
            updateProgress(4);
            showStep(step4PreferencesContainer);
        });
    }

    // Bookmark button functionality
    document.addEventListener('click', function(e) {
        if (e.target && e.target.closest('.bookmark-btn')) {
            const bookmarkBtn = e.target.closest('.bookmark-btn');
            const icon = bookmarkBtn.querySelector('i');
            
            if (!icon) return;
            
            // Toggle bookmark state
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                bookmarkBtn.classList.add('active');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                bookmarkBtn.classList.remove('active');
            }
        }
    });

    // Watch button functionality (would connect to streaming services in a real app)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.closest('.watch-btn')) {
            const watchBtn = e.target.closest('.watch-btn');
            const movieCard = watchBtn.closest('.movie-card');
            
            if (!movieCard) return;
            
            const movieTitle = movieCard.querySelector('.movie-title');
            if (movieTitle) {
                alert(`This would redirect to watch "${movieTitle.textContent}" in a real application.`);
            }
        }
    });
});