const input = document.getElementById('inputField'); 
const words = new Map();  
let selectedBone = null; 

// 1) Click on a bone: only remember which one and show the input 
document.addEventListener('click', (event) => {
    if(event.target.matches('path')){
        selectedBone = event.target.id; 
        input.style.display = 'block'; 
        input.focus(); 
    }
}); 

// 2) Attach the Enter listener Once 
input.addEventListener('keydown', (event) => {
    if (event.key != 'Enter') return; 

    const word = input.value.trim(); 
    words.set(selectedBone, word); 
    console.log(words); 

    input.value = ''; 
    input.value.display = 'none'; 
    selectedBone = null; 
}); 