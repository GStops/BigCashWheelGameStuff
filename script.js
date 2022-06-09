gsap.registerPlugin(CustomEase);

//timelines for spinner and pointer. Used for animation sequencing.
let spinnerTimeline = gsap.timeline({paused: true, autoRemoveChildren: true});
let pointerTimeline;

//used to calculate the degree rotation for the spinner and pointer. Leave as 0.
let prevSpinnerRotation = 0;
let prevPointerRotation = 0;

//Changing this will change how far the pointer bounces
let pointerMaxDegree = 170;

//Seperation between different slices of the wheel so that there is no dispute over where the pointer landed.
let wheelNumbersToAngles = {
    0: [-4, 14],
    1: [16, 33],
    2: [35, 63],
    3: [65, 94],
    4: [96, 124],
    5: [126, 154],
    6: [155, 184],
    7: [186, 214],
    8: [216, 244],
    9: [246, 274],
    10: [276, 304],
    11: [306, 334],
    12: [336, 354],
};



/*Pointer rotation
    Sets the pointer animation timeline
    returns the angle the pointer is at in degrees
    3 parts to the timeline. Revert to original from previous spin, Bounce back and forth, move to the random position. 
*/
let pointerRotation = function(time){
    pointerTimeline = gsap.timeline({paused: true});
    let randomPointerRotation = Math.floor(Math.random()* 170 + 1);
    let totalPointerDegrees = prevPointerRotation + 4*pointerMaxDegree + randomPointerRotation;
    let degreesPerSec = time/totalPointerDegrees
    pointerTimeline.to(".pointer",{
        duration: degreesPerSec * prevPointerRotation,
        rotation: "+=" + prevPointerRotation,
        ease: "linear",
    });

    pointerTimeline.to(".pointer", { //Bounces back and forth
        duration: degreesPerSec * pointerMaxDegree,
        rotation: "-=" + pointerMaxDegree,
        ease: "linear",
        yoyo: true,
        repeat: 3,
    });
    
    pointerTimeline.to(".pointer", { //random rotation after the bouncing
        duration: degreesPerSec * randomPointerRotation,
        rotation: "-=" + randomPointerRotation,
        ease: "linear",
    });

    
    return randomPointerRotation;
};



/* Spinner rotation calculation helper method 
    returns the total rotation and just the rotation added to make the given number win
*/
let spinnerRotationCalc = function(winNumber){
    let winNumberMinDeg = wheelNumbersToAngles[winNumber][0];
    let winNumberMaxDeg = wheelNumbersToAngles[winNumber][1];

    //random amount between the bounds of the min and max degrees of the winning slice
    let spinnerExtraDegCalc = Math.floor(Math.random()* (winNumberMaxDeg-winNumberMinDeg + 1) + winNumberMinDeg);
    let random360Amount = 360 * Math.floor(Math.random()*  4 + 7); //Just to increase amount of spins
    let totalSpinnerRotation = random360Amount - spinnerExtraDegCalc  + prevSpinnerRotation;
    return [totalSpinnerRotation, spinnerExtraDegCalc];
}



/* Spinner rotation method
    Sets up spinner animation in the timeline, returns the prev rotation amount
*/
let spinnerRotation = function(time, winNumber, pointerRotation){
    let spinnerInfo = spinnerRotationCalc(winNumber);
    let totalSpinnerRotation = spinnerInfo[0];
    let spinnerExtraDegCalc = spinnerInfo[1];

    //spinner animation
    spinnerTimeline.to(".spinner", {
        duration: time,
        ease: CustomEase.create("custom", "M0,0,C0.178,0,0.391,0.643,0.516,0.822,0.64,1,0.718,1,1,1"),
        rotation: "+=" + (totalSpinnerRotation - pointerRotation),

        onComplete: function(){
            gsap.set(".spinner", {
                rotation: gsap.getProperty(".spinner", "rotation") % 360, //sets rotation to same location but at a smaller degree. 
            });

            // renables the start button, disables and hides the rapid / instant buttons
            document.querySelector(".start").disabled = false;
            document.querySelector(".rapid").classList.add("hidden");
            document.querySelector(".instant").classList.add("hidden");
            document.querySelector(".hidden").disabled = true;

            //resets timescale back to 1x speed
            gsap.globalTimeline.timeScale(1);
        }
    });
    return spinnerExtraDegCalc + pointerRotation;
}


/* Method called when user wins. 
Matches pointer rotation to spinner rotation so that the winning number lines up with pointer
*/
let winMethod = function(time, winNumber){
    let extraPointerRotation = pointerRotation(time); //Sets the pointer timeline / returns the degree of the pointer
    let changeInRotation = spinnerRotation(time, winNumber, extraPointerRotation); //Sets the spinner timeline / returns the degree of the spinner
    
    spinnerTimeline.restart(); //plays the spinner animation
    gsap.to(pointerTimeline, { //plays the pointer animation, helper needed to call the entire timeline with an ease on it. 
        time: pointerTimeline.duration(),
        duration: pointerTimeline.duration(),
        ease: CustomEase.create("custom", "M0,0,C0.016,0,0.067,0.022,0.138,0.124,0.21,0.228,0.286,0.38,0.348,0.5,0.404,0.61,0.53,0.842,0.62,0.91,0.713,0.981,0.869,1,1,1"),
    }); 

    spinnerTimeline.invalidate(); //stops the animation from reverting the spinner back to original angle

    prevSpinnerRotation = changeInRotation;
    prevPointerRotation = extraPointerRotation;
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
