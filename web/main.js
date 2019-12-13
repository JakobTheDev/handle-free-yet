// API details
const API_URL = 'https://api.handlefreeyet.com';
const API_ROUTE_CHECK = '/check';
const API_ROUTE_SUBMIT = '/submit';
// References to inputs
const handleInput = document.getElementById('handle');
const handleError = document.getElementById('handle-error');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');
const notifyButton = document.getElementById('notify');
const notifyButtonText = document.getElementById('notify-button-text');
const notifyButtonLoader = document.getElementById('notify-button-loader');
const feedbackEmoji = document.getElementById('feedback-emoji');
const feedbackMessage = document.getElementById('feedback-message');

// Email validation regex
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
// Global variables
var showValidation = false;
var recaptchaToken = '';

/**
 * Handler for the 'Notify Me' button
 * Checks to see if the handle is available.
 * If not, submit the handle and email to recieve notifications.
 */
async function onClickNotifyMe() {
    // Enable validation messages
    showValidation = true;

    // Test validation
    // Run both validations first, else invalid handle will prevent email validation from running
    isHandleValid();
    isEmailValid();
    if (!isHandleValid() || !isEmailValid()) return;

    // Clear feedback message
    setFeedbackMessage('', '');

    // Set spinner
    setSpinner(true);

    // First, check if the handle is currently free
    checkResponse = await checkIfHandleIsFree(handleInput.value);

    // Handle account is free
    if (checkResponse.isFree) {
        // Handle is free
        setFeedbackMessage('😲', 'Your handle already is free, go claim it!');
        // Stop spinner
        setSpinner(false);
        return;
    }

    // Handle actual errors
    if (!checkResponse.success) {
        // Handle is free
        setFeedbackMessage('😢', 'Something went wrong... Try again later.');
        // Stop spinner
        setSpinner(false);
        return;
    }

    // Next, submit the handle to be monitored
    submitResponse = await submitHandle(handleInput.value, emailInput.value);

    // Handle and email combo already submitted
    if (submitResponse.isDuplicate) {
        // Handle is free
        setFeedbackMessage('😘', "You're already watching this handle, hold tight.");
        // Stop spinner
        setSpinner(false);
        return;
    }

    // Cheeky cheeky
    if (submitResponse.isJakob) {
        // Handle is free
        setFeedbackMessage('🤫', "PROHIBITED. Don't be cheeky!");
        // Stop spinner
        setSpinner(false);
        return;
    }

    // Cheeky cheeky
    if (!submitResponse.success) {
        // Handle is free
        setFeedbackMessage('😢', 'Something went wrong... Try again later.');
        // Stop spinner
        setSpinner(false);
        return;
    }

    // Cheeky cheeky
    if (submitResponse.success && !submitResponse.isDuplicate && !submitResponse.isJakob) {
        // Handle is free
        setFeedbackMessage('😎', "All sorted! We'll let you know when it's free");
        // Stop spinner
        setSpinner(false);
        return;
    }

    // Stop spinner regardless
    setSpinner(false);
}

/**
 * Check the Twitter API to see if a given handle is free.
 * @param {string} handle The handle submitted by the user.
 */
async function checkIfHandleIsFree(handle) {
    // Construct query parameters
    const queryParams = {
        method: 'POST',
        headers: {
            'content-type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
            screen_name: handle
        })
    };

    // Query the API
    return fetch(API_URL + API_ROUTE_CHECK, queryParams).then(blob => blob.json());
}

/**
 * Submit a handle to be monitored by HandleFreeYet
 * @param {string} handle The handle submitted by the user.
 * @param {string} email The email to send notifications to.
 */
async function submitHandle(handle, email) {
    // Construct query parameters
    const queryParams = {
        method: 'POST',
        headers: {
            'content-type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
            screen_name: handle,
            email,
            recaptchaToken
        })
    };

    // Refetcha recaptcha token (Can only use once)
    fetchRecaptchaToken()

    // Query the API
    return fetch(API_URL + API_ROUTE_SUBMIT, queryParams).then(blob => blob.json());
}

handleInput.addEventListener('keyup', function(event) {
    // Submit on enter press
    if (event.keyCode === 13) {
        onClickNotifyMe();
    }

    // Don't do anything if validation is disabled
    if (showValidation === false) return;

    // Do handle validation
    isHandleValid();
});

emailInput.addEventListener('keyup', function(event) {
    // Submit on enter press
    if (event.keyCode === 13) {
        onClickNotifyMe();
    }

    // Don't do anything if validation is disabled
    if (showValidation === false) return;

    // Do email validation
    isEmailValid();
});

function isHandleValid() {
    // Check handle is provided
    if (handleInput.value === '') {
        handleError.innerHTML = 'Required';
        return false;
    }

    // Check handle isn't too long
    if (handleInput.value.length > 15) {
        handleError.innerHTML = 'Twitter handles are 15 characters or fewer';
        return false;
    }

    // No validation issues found, clear error
    handleError.innerHTML = '';
    return true;
}

function isEmailValid() {
    // Use inbuilt email validator
    if (!emailRegex.test(String(emailInput.value).toLowerCase())) {
        emailError.innerHTML = 'Please enter a valid email';
        return false;
    }

    // No validation issues found, clear error
    emailError.innerHTML = '';
    return true;
}

function setSpinner(active) {
    if (active) {
        notifyButtonText.classList = 'hidden';
        notifyButtonLoader.classList = 'lds-ellipsis';
    } else {
        notifyButtonText.classList = '';
        notifyButtonLoader.classList = 'hidden lds-ellipsis';
    }
}

function setFeedbackMessage(emoji, message) {
    feedbackEmoji.innerHTML = emoji;
    feedbackMessage.innerHTML = message;
}

grecaptcha.ready(function() {
    grecaptcha.execute('6LdEgMcUAAAAAOeGI2F9UPKOzcfMb0EgTwLy0CV0', { action: 'submit' }).then(function(token) {
        recaptchaToken = token;
    });
});

function fetchRecaptchaToken() {
    grecaptcha.ready(function() {
        grecaptcha.execute('6LdEgMcUAAAAAOeGI2F9UPKOzcfMb0EgTwLy0CV0', { action: 'submit' }).then(function(token) {
            recaptchaToken = token;
        });
    });
}
