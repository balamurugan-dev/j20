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
                // console.error('Failed to copy: ', err);
            });

    });
    //select input,output and convert btn
    var convert = document.getElementById('convert-btn')
    var inputText = document.getElementById('input-text')
    var outputText = document.getElementById('output-text')
    var className = document.getElementById("class-name-input")
    convert.addEventListener('click', function () {
        // console.log(inputText.value)
        // console.log(className.value)
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
            vscode.postMessage({ command: 'j20', text: inputText.value ,object:options,className:className.value})
        }
        // outputText.textContent = inputText.value
    })
    //text Area changes or paste
    inputText.addEventListener('input',convertCode);
    inputText.addEventListener('paste',convertCode);
    //call btn fuction for code change

    document.getElementById("null-safety").addEventListener("change", function() {
       convertCode();
    });
    document.getElementById("types-only").addEventListener("change", function() {
        convertCode();
     });
     document.getElementById("type-check").addEventListener("change", function() {
        convertCode();
     });
     document.getElementById("encoder-decoder").addEventListener("change", function() {
        convertCode();
     });
     document.getElementById("pro-required").addEventListener("change", function() {
        convertCode();
     });
     document.getElementById("pro-final").addEventListener("change", function() {
        convertCode();
     });
     document.getElementById("copywith").addEventListener("change", function() {
        convertCode();
     });
     document.getElementById("optional").addEventListener("change", function() {
        convertCode();
     });
     document.getElementById("freezed").addEventListener("change", function() {
        convertCode();
     });


        function convertCode() {
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
                vscode.postMessage({ command: 'j20', text: inputText.value ,object:options,className:className.value})
            }
        }
    
    // Handle the message inside the webview
    window.addEventListener('message', event => {

        const message = event.data; // The JSON data our extension sent
        switch (message.command) {
            case 'j20':
                outputText.textContent = message.code
                break;
        }
    });
    
    //hide container
    var hidebtn = document.getElementById("hide-button")
    var optionsContainer = document.getElementById("options-container")
    hidebtn.addEventListener('click',function(){
        if (optionsContainer.style.display === 'none') {
            optionsContainer.style.display = 'block';
            hidebtn.textContent = "Hide Options"

          } else {
            optionsContainer.style.display = 'none';
            hidebtn.textContent = "Show Options"
          }
    })

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
    }

