gsap.registerPlugin(CustomEase);

//timelines for spinner and pointer. Used for animation sequencing.
let spinnerTimeline = gsap.timeline({paused: true, autoRemoveChildren: true});
let pointerTimeline;

//used to calculate the degree rotation for the spinner and pointer. Changes after every spin. 
let prevSpinnerRotation = 0;
let prevPointerRotation = 0;

//Changing this will change how far the pointer bounces
let pointerMaxDegree = 170;

//Seperation between different slices of the wheel so that there is no dispute over where the pointer landed.
let wheelNumbersToAngles = {
    0: [-6, 12],
    1: [14, 32],
    2: [34, 62],
    3: [64, 93],
    4: [95, 123],
    5: [124, 152],
    6: [154, 182],
    7: [184, 212],
    8: [214, 242],
    9: [244, 272],
    10: [274, 302],
    11: [304, 333],
    12: [334, 352],
};



/*Pointer rotation
    Sets the pointer animation timeline
    returns the angle the pointer is at in degrees
    3 parts to the timeline: Revert to original from previous spin, Bounce back and forth, move to the random position. 
*/
let pointerRotation = function(time){
    pointerTimeline = gsap.timeline({paused: true, defaults:{ease: "linear"}});
    let randomPointerRotation = Math.floor(Math.random()* pointerMaxDegree + 1);
    let totalPointerDegrees = prevPointerRotation + 4*pointerMaxDegree + randomPointerRotation;
    let degreesPerSec = time/totalPointerDegrees
    pointerTimeline.to(".pointer",{
        duration: degreesPerSec * prevPointerRotation,
        rotation: "+=" + prevPointerRotation,
    });

    pointerTimeline.to(".pointer", { //Bounces back and forth
        duration: degreesPerSec * pointerMaxDegree,
        rotation: "-=" + pointerMaxDegree,
        yoyo: true,
        repeat: 3,
    });
    
    pointerTimeline.to(".pointer", { //random rotation after the bouncing
        duration: degreesPerSec * randomPointerRotation,
        rotation: "-=" + randomPointerRotation,
    });

    
    return randomPointerRotation;
};



/*Can be used for win or loss, just call this method and add the extra angle*/
let generalSpinnerRotationCalc = function(){
    let random360Amount = 360 * Math.floor(Math.random()*  4 + 7); //Just to increase amount of spins
    let resetBackToStart = prevSpinnerRotation;
    return resetBackToStart + random360Amount;
}

/* Spinner winning rotation calculation method 
    returns the total rotation and the rotation added to shift the spinner to the winning number
*/
let winningSpinnerRotationCalc = function(winNumber, pointerExtraDeg){
    let winNumberMinDeg = wheelNumbersToAngles[winNumber][0];
    let winNumberMaxDeg = wheelNumbersToAngles[winNumber][1];
    //random amount between the bounds of the min and max degrees of the winning slice
    let spinnerWinDegCalc = Math.floor(Math.random()* (winNumberMaxDeg-winNumberMinDeg) + winNumberMinDeg);
    let totalSpinnerRotation = generalSpinnerRotationCalc() - spinnerWinDegCalc - pointerExtraDeg;
    return [totalSpinnerRotation, spinnerWinDegCalc + pointerExtraDeg];
}


/*Sets up and plays spinner / pointer animations
    Can be used for win or loss.
*/
let generalAnimationMethod = function(time, totalRotation){
    //Spinner animation
    spinnerTimeline.to(".spinner", {
        duration: time,
        ease: CustomEase.create("custom", "M0,0,C0.178,0,0.391,0.643,0.516,0.822,0.64,1,0.718,1,1,1"),
        rotation: "+=" + (totalRotation),
        onComplete: function(){
            gsap.set(".spinner", {
                rotation: gsap.getProperty(".spinner", "rotation") % 360, //sets rotation to same location but at a smaller degree. 
            });

            // renables the start button, disables and hides the rapid / instant buttons
            document.querySelector(".start").disabled = false;
            document.querySelector(".rapid").classList.add("hidden");
            document.querySelector(".instant").classList.add("hidden");
            document.querySelector(".hidden").disabled = true;

            gsap.globalTimeline.timeScale(1); //resets timescale back to 1x speed
        }
    });

    spinnerTimeline.restart(); //plays the spinner animation

    gsap.to(pointerTimeline, { //plays the pointer animation, calls the entire timeline with an ease on it. 
        time: pointerTimeline.duration(),
        duration: pointerTimeline.duration(),
        ease: CustomEase.create("custom", "M0,0,C0.016,0,0.067,0.022,0.138,0.124,0.21,0.228,0.286,0.38,0.348,0.5,0.404,0.61,0.53,0.842,0.62,0.91,0.713,0.981,0.869,1,1,1"),
    }); 

    spinnerTimeline.invalidate(); //stops the animation from reverting the spinner back to original angle
}


let winMethod = function(time, winNumber){
    let pointerExtraDeg = pointerRotation(time); //Sets the pointer timeline / returns the degree of the pointer
    let spinnerInfo = winningSpinnerRotationCalc(winNumber, pointerExtraDeg); 
    let totalSpinnerRotation = spinnerInfo[0];
    let spinnerExtraDeg = spinnerInfo[1];
    generalAnimationMethod(time, totalSpinnerRotation);
    prevSpinnerRotation = spinnerExtraDeg;
    prevPointerRotation = pointerExtraDeg;
}



//start button click function
document.querySelector(".start").addEventListener("click", function(){
    let startButton = document.querySelector(".start");
    startButton.disabled = true; //once it is clicked, it cannot be clicked again until after the spin finishes

    //shows / enables rapid button
    let rapidButton = document.querySelector(".rapid"); 
    rapidButton.disabled = false;
    rapidButton.classList.remove("hidden");

    //shows / enables instant button
    let instantButton = document.querySelector(".instant"); 
    instantButton.disabled = false;
    instantButton.classList.remove("hidden");

    //win method call (time, winningSliceNumber)
    let winningSliceNumber = document.getElementById("inputText").value;
    winMethod(5, winningSliceNumber);

});


//rapid button click function
document.querySelector(".rapid").addEventListener("click", function(){
    gsap.globalTimeline.timeScale(2); //doubles speed
});

//instant button click function
document.querySelector(".instant").addEventListener("click", function(){
    spinnerTimeline.progress(1);
    gsap.killTweensOf(pointerTimeline);
    pointerTimeline.progress(1); 

});
