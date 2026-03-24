// Select the search form and movie results container
const searchForm = document.getElementById('search-form');
const movieResults = document.getElementById('movie-results');

const watchlist = new Set(); // Use a Set to avoid duplicates
const watchlistContainer = document.getElementById('watchlist');

const apiKey = 'your-api-key'; // Replace with your OMDb API key

// Select modal elements
const modal = document.getElementById('movie-modal');
const modalClose = document.querySelector('.modal-close');
const modalPoster = document.getElementById('modal-poster');
const modalTitle = document.getElementById('modal-title');
const modalYear = document.getElementById('modal-year');
const modalRated = document.getElementById('modal-rated');
const modalGenre = document.getElementById('modal-genre');
const modalDirector = document.getElementById('modal-director');
const modalActors = document.getElementById('modal-actors');
const modalPlot = document.getElementById('modal-plot');

// Function to fetch and show full movie details
function showMovieDetails(imdbID) {
  fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbID}&plot=full`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (data.Response === "True") {
        modalPoster.src = data.Poster !== 'N/A' ? data.Poster : 'https://via.placeholder.com/300x450?text=No+Image';
        modalTitle.textContent = data.Title;
        modalYear.textContent = data.Year;
        modalRated.textContent = data.Rated;
        modalGenre.textContent = data.Genre;
        modalDirector.textContent = data.Director;
        modalActors.textContent = data.Actors;
        modalPlot.textContent = data.Plot;
        modal.style.display = 'block';
      } else {
        alert('Movie details not found.');
      }
    })
    .catch(err => {
      console.error('Details fetch error:', err);
      alert('Error fetching movie details. Try again later.');
    });
}

// Close modal
modalClose.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Close modal on clicking outside content
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// Example: Update renderMovies to include Details button
function renderMovies(movies) {
  movieResults.innerHTML = '';
  movies.forEach(movie => {
    const isInWatchlist = watchlist.some(w => w.imdbID === movie.imdbID);
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <div class="movie-info">
        <button class="btn-details">Details</button>
        <button class="btn ${isInWatchlist ? 'btn-remove' : ''}">
          ${isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </button>
      </div>
      <img class="movie-poster" src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Image'}" alt="${movie.Title}">
      <div class="movie-info">
        <h3 class="movie-title">${movie.Title}</h3>
        <p class="movie-year">${movie.Year}</p>
      </div>
    `;

    const detailsBtn = card.querySelector('.btn-details');
    detailsBtn.addEventListener('click', () => showMovieDetails(movie.imdbID));

    const watchBtn = card.querySelector('.btn');
    watchBtn.addEventListener('click', () => toggleWatchlist(movie, watchBtn));

    movieResults.appendChild(card);
  });
}
// Function to fetch movies from the OMDb API
async function fetchMovies(query) {
  const url = `https://www.omdbapi.com/?s=${query}&apikey=${apiKey}`;

  try {
    // Fetch data from the API
    const response = await fetch(url);

    // Check if the response is ok (status code 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check if the response contains movies
    if (data.Response === 'True') {
      displayMovies(data.Search);
    } else {
      movieResults.innerHTML = '<p class="no-results">No results found. Please try a different search.</p>';
    }
  } catch (error) {
    console.error('Error fetching movies:', error);
    movieResults.innerHTML = '<p class="error-message">Something went wrong. Please try again later.</p>';
  }
}

// Function to save the watchlist to local storage
function saveWatchlist() {
  localStorage.setItem('watchlist', JSON.stringify(Array.from(watchlist)));
}

// Function to load the watchlist from local storage
function loadWatchlist() {
  const storedWatchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
  storedWatchlist.forEach((movieID) => watchlist.add(movieID));
}

// Function to remove a movie from the watchlist
function removeFromWatchlist(movieID) {
  if (watchlist.has(movieID)) {
    watchlist.delete(movieID);
    saveWatchlist();
    updateWatchlistDisplay();
  }
}

// Function to update the watchlist display
async function updateWatchlistDisplay() {
  watchlistContainer.innerHTML = ''; // Clear previous watchlist

  if (watchlist.size === 0) {
    watchlistContainer.innerHTML = '<p>Your watchlist is empty. Search for movies to add!</p>';
  } else {
    for (const movieID of watchlist) {
      const url = `https://www.omdbapi.com/?i=${movieID}&apikey=${apiKey}`;

      try {
        const response = await fetch(url);

        // Check if the response is ok (status code 200-299)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const movie = await response.json();

        const watchlistCard = document.createElement('div');
        watchlistCard.classList.add('movie-card');

        watchlistCard.innerHTML = `
          <img src="${movie.Poster}" alt="${movie.Title}" class="movie-poster">
          <div class="movie-info">
            <h3 class="movie-title">${movie.Title}</h3>
            <p class="movie-year">${movie.Year}</p>
            <button class="btn btn-details">Details</button>
            <button class="btn btn-remove" onclick='removeFromWatchlist("${movie.imdbID}")'>Remove</button>
          </div>
        `;

        // Add event listener to the 'Details' button
        watchlistCard.querySelector('.btn-details').addEventListener('click', handleDetailsButtonClick(movie.imdbID));

        watchlistContainer.appendChild(watchlistCard);
      } catch (error) {
        console.error('Error fetching movie details:', error);
        watchlistContainer.innerHTML = '<p class="error-message">Something went wrong. Please try again later.</p>';
      }
    }
  }
}

// Function to add a movie to the watchlist
function addToWatchlist(movie) {
  if (!watchlist.has(movie.imdbID)) {
    watchlist.add(movie.imdbID);
    saveWatchlist();
    updateWatchlistDisplay();
  }
}

// Function to handle the 'Add to Watchlist' button click
const handleAddToWatchlist = (movie) => {
  return () => addToWatchlist(movie);
};

// Function to open the modal with movie details
async function openModal(movieID) {
  const url = `https://www.omdbapi.com/?i=${movieID}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const movie = await response.json();

    modalContent.innerHTML = `
      <img src="${movie.Poster}" alt="${movie.Title}" class="movie-poster">
      <h2>${movie.Title} (${movie.Year})</h2>
      <p><strong>Rating:</strong> ${movie.imdbRating}</p>
      <p><strong>Genre:</strong> ${movie.Genre}</p>
      <p><strong>Director:</strong> ${movie.Director}</p>
      <p><strong>Cast:</strong> ${movie.Actors}</p>
      <p><strong>Plot:</strong> ${movie.Plot}</p>
    `;

    modal.style.display = 'block';
  } catch (error) {
    console.error('Error fetching movie details:', error);
    modalContent.innerHTML = '<p class="error-message">Something went wrong. Please try again later.</p>';
  }
}

// Function to close the modal
function closeModal() {
  modal.style.display = 'none';
}

// Event listener to close the modal when clicking outside of it
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

// Function to handle the 'Details' button click
const handleDetailsButtonClick = (movieID) => {
  return () => openModal(movieID);
};

// Function to display movies in the results section
function displayMovies(movies) {
  movieResults.innerHTML = ''; // Clear previous results

  // Loop through each movie and create a card
  movies.forEach((movie) => {
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');

    movieCard.innerHTML = `
      <img src="${movie.Poster}" alt="${movie.Title}" class="movie-poster">
      <div class="movie-info">
        <h3 class="movie-title">${movie.Title}</h3>
        <p class="movie-year">${movie.Year}</p>
        <button class="btn btn-details">Details</button>
        <button class="btn btn-add">Add to Watchlist</button>
      </div>
    `;

    // Add event listener to the 'Details' button
    movieCard.querySelector('.btn-details').addEventListener('click', handleDetailsButtonClick(movie.imdbID));

    // Add event listener to the 'Add to Watchlist' button
    movieCard.querySelector('.btn-add').addEventListener('click', handleAddToWatchlist(movie));

    movieResults.appendChild(movieCard);
  });
}

// Event listener for the search form submission
searchForm.addEventListener('submit', (event) => {
  event.preventDefault(); // Prevent the form from submitting the traditional way

  const query = document.getElementById('movie-search').value.trim();
  if (query) {
    fetchMovies(query);
    document.getElementById('movie-search').value = ''; // Clear the search field
  }
});

// Load the watchlist when the page loads
window.addEventListener('load', () => {
  loadWatchlist();
  updateWatchlistDisplay();
});
