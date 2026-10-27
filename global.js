// global.js 

const input = document.getElementById('input');
const output_word = document.getElementById('output_word'); 
const colorEl = document.getElementsByClassName('circle'); // what does this return? 
const colorWheel = document.getElementById('color-wheel'); 
const words = {
    bone: "", 
    word: ""
};  // global variable in a way 


// Logging clicked bone part 
document.addEventListener('click', (event) => {
            if(event.target.tagName == 'path') {
                words.bone = event.target.id; 
                getUserInput(); 
                // console.log(words); 
            } 
            else if(colorWheel){
                const selectedColor = colorWheel.value;  
                if(event.target.tagName == 'path'){
                    console.log('here'); 
                    console.log('bone to color selected'); 
                    event.target.style.fill = selectedColor; 
                    // So this is triggering inside of it? 
                    // It is not only nested in here but then 
                    // triggering the other one. 
                }
            }
            else if(colorEl){
                const computedStyle = window.getComputedStyle(event.target); 
                const selectedColor = computedStyle.backgroundColor; 

                if(event.target.tagName == 'path'){
                    console.log(event.target.tagName); 
                    event.target.style.fill = selectedColor; 
                }
            }

            // Why is this triggering the other one? 
        })


function getUserInput(){
        input.style.display = 'block'; // show the input field
        input.addEventListener('keydown', function(event) { 
            if (event.key == "Enter"){
                words.word = input.value; 
                // clear input field
                input.style.display = 'none';
                console.log(words)
                input.value = ""; 
                printUserInput(); 
            }
        });
}

function printUserInput(){
    output_word.textContent = words.word; 
}; 

// This is a function that will take everything 
function colorBone() {
}; 

function saveState() {}; 

function downloadfile(){}; 

function hidebone(){};  

/*

function (getUserInput){

1. Click on bone 
2. Text input appear 
3. Enter a word 
4. Click enter (submit a word)
5. console.log({bone: word})
}
*/
