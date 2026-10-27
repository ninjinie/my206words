SVGElement.addEventListener('click', () => {
    const userText = prompt("Enter a word:"); 
    if(userText) {
        outputP.textContent='"${userText}"'; 
    }
})