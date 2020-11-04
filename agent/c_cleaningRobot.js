/* The general structure is to put the AI code in xyz.js and the visualization
   code in c_xyz.js. Create a diagram object that contains all the information
   needed to draw the diagram, including references to the environment&agents.
   Then use a draw function to update the visualization to match the data in
   the environment & agent objects. Use a separate function if possible for 
   controlling the visualization (whether through interaction or animation). 
   Chapter 2 has minimal AI and is mostly animations. */

const SIZE = 100;
const Y_SPACE = 120;
let AUTO_RANDOM_STATE = true;

/* Position Mapping */
function xPosition(floorNumber) {
    return {0: 60, 1: 320, 2: 320, 3: 60}[floorNumber];
}

function yPosition(floorNumber) {
    return {0: 420, 1: 420, 2: 200, 3: 200}[floorNumber];
}


/* Create a diagram object that includes the world (model) and the svg
   elements (view) */
function makeDiagram(selector) {
    let diagram = {}, world = new World(4);
    diagram.world = world;

    diagram.root = d3.select(selector);
    diagram.robot = diagram.root.append('g')
        .attr('class', 'robot')
        .style('transform', `translate(${xPosition(world.location)}px,${yPosition(world.location)-Y_SPACE}px)`);
    diagram.robot.append('rect')
        .attr('width', SIZE)
        .attr('height', SIZE)
        .attr('fill', 'hsl(120,25%,50%)');
    diagram.perceptText = diagram.robot.append('text')
        .attr('x', SIZE/2)
        .attr('y', -25)
        .attr('text-anchor', 'middle');
    diagram.actionText = diagram.robot.append('text')
        .attr('x', SIZE/2)
        .attr('y', -10)
        .attr('text-anchor', 'middle');

    diagram.floors = [];

    for (let floorNumber = 0; floorNumber < world.floors.length; floorNumber++) {
        diagram.floors[floorNumber] =
            diagram.root.append('rect')
            .attr('class', 'clean floor') // for css
            .attr('x', xPosition(floorNumber))
            .attr('y', yPosition(floorNumber))
            .attr('width', SIZE)
            .attr('height', SIZE/4)
            .attr('stroke', 'black')
            .on('click', function() {
                world.markFloorDirty(floorNumber);
                diagram.floors[floorNumber].attr('class', 'dirty floor');
            });
    }
    return diagram;
}


/* Rendering functions read from the state of the world (diagram.world) 
   and write to the state of the diagram (diagram.*). For most diagrams
   we only need one render function. For the vacuum cleaner example, to
   support the different styles (reader driven, agent driven) and the
   animation (agent perceives world, then pauses, then agent acts) I've
   broken up the render function into several. */

function renderWorld(diagram) {
    for (let floorNumber = 0; floorNumber < diagram.world.floors.length; floorNumber++) {
        let currentState;
        if (diagram.world.floors[floorNumber].dirty) {
            currentState = 'dirty floor';
        } else {
            currentState = 'clean floor';
        }        
        diagram.floors[floorNumber].attr('class', currentState);
    }
    diagram.robot.style('transform', `translate(${xPosition(diagram.world.location)}px,${yPosition(diagram.world.location)-Y_SPACE}px)`);
}

function renderAgentPercept(diagram, dirty) {
    let perceptLabel = "O quadrado "+ diagram.world.location + ({false: " encontra-se limpo", true: " encontra-se sujo"}[dirty]);
    diagram.perceptText.text(perceptLabel);
}

function renderAgentAction(diagram, action) {
    let actionLabel = {null: 'Esperando', 'SUCK': 'Aspirando', 'LEFT': 'Indo pra esquerda', 'RIGHT': 'Indo pra direita', 'UP': 'Indo pra cima', 'DOWN':'Indo para baixo'}[action];
    diagram.actionText.text(actionLabel);
}

function renderLocal(diagram){
    let localLabel = diagram.world.location;
    diagram.localText.text(localLabel);
}


/* Control the diagram by letting the AI agent choose the action. This
   controller is simple. Every STEP_TIME_MS milliseconds choose an
   action, simulate the action in the world, and draw the action on
   the page. */

const STEP_TIME_MS = 2500;
function makeAgentControlledDiagram() {
    let diagram = makeDiagram('#agent-controlled-diagram svg');

    function update() {
        let location = diagram.world.location;
        let percept = diagram.world.floors[location].dirty;
        let action = reflexVacuumAgent(diagram.world);
        diagram.world.simulate(action);
        renderWorld(diagram, action);
        renderAgentAction(diagram, action);
        renderAgentPercept(diagram, percept);
        randomState();
    }
    function randomState() {
        if (AUTO_RANDOM_STATE) {
            let max = 3, min = 0;
            let state = Math.floor(Math.random() * (max - min + 1)) + min;
            let floorNumber = Math.floor(Math.random() * (max - min + 1)) + min;
            if (floorNumber != diagram.world.location) {
                if (state % 2 == 0) {
                    if (diagram.world.markFloorDirty(floorNumber)) {
                        diagram.floors[floorNumber].attr('class', 'dirty floor');
                    }
                }
            }
        }
    }
    setInterval(update, STEP_TIME_MS);
    return diagram;
}