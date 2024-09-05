// //select element
// var headerName = document.querySelector('header')
// function changeColor(){
//   headerName.style.backgroundColor = 'blue'
//   const vscode = acquireVsCodeApi();
//   vscode.postMessage({
//     command: 'copycode',
//     text: '🐛  on line ' + 5
// })
// //   alert('Code copied!');

// }
//script add event listener
window.addEventListener('DOMContentLoaded', () => {
    const copyButton = document.getElementById('copy-btn');
    const vscode = acquireVsCodeApi();
    //copy function
    copyButton.addEventListener('click', function () {
        navigator.clipboard.writeText(outputText.innerText).then(() => {
            copyButton.textContent = 'copied'
            copyButton.style.backgroundColor = 'green'
            vscode.postMessage({
                command: 'copycode',
                text: '🐛  on line ' + 5
            })
        })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });

    });
    //select input,output and convert btn
    var convert = document.getElementById('convert-btn')
    var inputText = document.getElementById('input-text')
    var outputText = document.getElementById('output-text')
    convert.addEventListener('click', function () {
        console.log(inputText.value)
        var options = {
            nullSafety: document.getElementById('null-safety').checked,
            typesonly: document.getElementById('types-only').checked,
            typecheck: document.getElementById('type-check').checked,
            encoder: document.getElementById('encoder-decoder').checked,
            required: document.getElementById('pro-required').checked,
            final: document.getElementById('pro-final').checked,
            copywith: document.getElementById('copywith').checked,
             optional: document.getElementById('optional').checked,
            freezed: document.getElementById('freezed').checked
        }
        if (inputText.value) {
            vscode.postMessage({ command: 'j20', text: inputText.value ,object:options})
        }
        console.log(outputText.textContent)
        // outputText.textContent = inputText.value
    })
    // Handle the message inside the webview
    window.addEventListener('message', event => {

        const message = event.data; // The JSON data our extension sent
        console.log(message)
        switch (message.command) {
            case 'j20':
                outputText.textContent = message.code
                break;
        }
    });

});
    //get selected options
    function getSelectedOptions() {
        var options = {
            nullSafety: document.getElementById('null-safety').checked,
            typesonly: document.getElementById('types-only').checked,
            typecheck: document.getElementById('type-check').checked,
            encoder: document.getElementById('encoder-decoder').checked,
            required: document.getElementById('pro-required').checked,
            final: document.getElementById('pro-final').checked,
            copywith: document.getElementById('copywith').checked,
             optional: document.getElementById('optional').checked,
            freezed: document.getElementById('freezed').checked
        }
        console.log(`OPTIONS : ${JSON.stringify(options)}`)
    }
