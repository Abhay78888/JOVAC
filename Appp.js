const TMDB_KEY="";
const GEMINI_KEY="";
const IMAGE_URL="https://image.tmdb.org/t/p/w500";

let currentMovie="";//current filam





async function fetchAll(){
    const movieName=document.getElementById("movie-input").value.trim();
    if(movieName==""){
        alert("Plz enter a movie name");
        return;
    }
    try{

    const searchResponse= await fetch(
                `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${movieName}`

    );
    const searchData=await searchResponse.json();


    const movie = searchData.results[0];
    const id=movie.id;
    const type=movie.media_type;

    const detailResponse=await fetch(
            `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_KEY}&append_to_response=credits,similar`

    );
    const details=await detailResponse.json();
    console.log(details);
    currentMovie=details;


    displayMovie(details,type);
    displayCast(details.credits.cast);
    displaySimilar(details.similar.results);

}
catch(error){
    console.log(error);
    document.getElementById("movie-error").style.display="block";
    document.getElementById("movie-error").innerText="Something went wrong";

}




}


function displayMovie(movie,type){
    const title=movie.title || movie.name;
    const year=(movie.release_date || movie.first_air_date || "").slice(0,4);
    let poster;

    if (movie.poster_path) {
    poster = "https://image.tmdb.org/t/p/w500" + movie.poster_path;
    } 
    else {
    poster = "https://via.placeholder.com/300x450";
    }
    const genres=movie.genres.map(g=>g.name).join(", ")

    document.getElementById("movie-card").innerHTML=`
        <img src="${poster}" class="movie-poster">
        <div class="movie-title">${title}</div>
        <div>⭐ ${movie.vote_average.toFixed(1)} | ${year} | ${type}</div>
        <div>${genres}</div>
        <div>${movie.overview}</div>
    `;



}


function displayCast(cast){
    const castGrid= document.getElementById("cast-grid");
    cast=cast.slice(0,6);

    if(cast.length==0){
        castGrid.innerHTML="<p>saare cast actors bhag gye</p>";
        return;
    }
    castGrid.innerHTML="";
    cast.forEach(actor=>{
        let image;


        if (actor.profile_path) {
        image = "https://image.tmdb.org/t/p/w500" + actor.profile_path;
        } else {
        image = "https://via.placeholder.com/80";
        }
        castGrid.innerHTML += `
            <div class="cast-card">
                <img src="${image}" class="cast-photo">
                <div class="cast-name">${actor.name}</div>
                <div class="cast-role">${actor.character || ""}</div>
            </div>
        `;




      

    })

}
function displaySimilar(similarMovies){
    const similarGrid=document.getElementById("similar-grid");
    similarMovies=similarMovies.slice(0,6);
    if(similarMovies.length==0){
        similarGrid.innerHTML="<p>tumhaari movie jaisi vaahiyad movie not available</p>";
        return;
    }
    similarGrid.innerHTML="";
    similarMovies.forEach(
        movie=>{
            const title=movie.name || movie.title;
            const poster = movie.poster_path
            ? "https://image.tmdb.org/t/p/w500" + movie.poster_path
            : "https://via.placeholder.com/50x70";

        similarGrid.innerHTML += `
            <div class="similar-card" onclick="searchMovie('${title}')">
                <img src="${poster}" class="similar-poster">
                <div class="similar-title">${title}</div>
                <div>⭐ ${movie.vote_average.toFixed(1)}</div>
            </div>
        `;

            
            
        }
    )
    
}

function searchMovie(name){
    document.getElementById("movie-input").value=name;
    fetchAll();
}

document.getElementById("movie-input").addEventListener("keydown",function(event){
    if(event.key==="Enter"){
        fetchAll();
    }
})

function addMessage(role, text) {

    const chat = document.getElementById("chat-messages");

    const message = document.createElement("div");

    message.className = "msg " + role; // "msg user" or "msg ai"

    message.innerHTML = `
        <div class="msg-avatar">${role == "user" ? "👤" : "🤖"}</div>
        <div class="msg-bubble">${text}</div>
    `;

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight; // auto scroll to bottom
}
async function sendMessage() {

    const input = document.getElementById("ai-input");
    const question = input.value.trim();

    if (question == "") return;

    // Show user message
    addMessage("user", question);
    input.value = "";

    // Build prompt with movie context
    const movieTitle = currentMovie.title || currentMovie.name || "";
    const movieOverview = currentMovie.overview || "";

    const prompt = `
Movie Name: ${movieTitle}
Movie Story: ${movieOverview}
User Question: ${question}
Answer in short and simple English.
    `;

    // Call Gemini API
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        }
    );

    const data = await response.json();



console.log(data);

if (!response.ok) {
    addMessage("ai", data.error?.message || "Gemini API Error");
    return;
}

if (!data.candidates || data.candidates.length === 0) {
    addMessage("ai", "No response from Gemini.");
    return;
}
    // Extract reply
const answer = data.candidates[0].content.parts[0].text;
addMessage("ai", answer);
}

document.getElementById("ai-input").addEventListener("keydown",function(event){
    if(event.key=="Enter"){
        sendMessage();
    }
})

function useSuggestion(button){
    const text=button.innerText;
    document.getElementById("ai-input").value=text;
    sendMessage();
}

document.getElementById("movie-input").value="Interstellar";
fetchAll();

