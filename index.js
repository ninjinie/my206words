document.addEventListener('click', (event) => {
    const clickedId = event.target.id;
    
    if (clickedId) {
        window.location.href = "/" + clickedId + ".html";
    } else {
        console.log('The clicked element does not have an ID.');
    }
});

// Need to make sure everything is the same. 