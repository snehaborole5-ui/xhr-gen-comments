const cl = console.log;

const loader = document.getElementById('loader'); 
const commentTableBody = document.getElementById('commentTableBody');
const commentForm = document.getElementById('commentForm');
const titleControl = document.getElementById('title');
const userIdControl = document.getElementById('userId');
const completedControl = document.getElementById('completed');
const addBtn = document.getElementById('addBtn');
const updateBtn = document.getElementById('updateBtn');

const BASE_URL = `https://promise-crud-sneha-b21-default-rtdb.asia-southeast1.firebasedatabase.app`;
const COMMENT_URL = `${BASE_URL}/comments.json`;

let commentsArr = [];
let updateId = null;

function snackbar(msg, icon) {
    Swal.fire({
        title: msg,
        icon: icon || 'success',
        showConfirmButton: true,      
        confirmButtonText: 'OK',       
        confirmButtonColor: '#007bff'  
    });
}

function initTooltips() {
    if (window.$ && typeof $.fn.tooltip === 'function') {
        $('[data-toggle="tooltip"]').tooltip('dispose'); 
        $('[data-toggle="tooltip"]').tooltip({ boundary: 'window' }); 
    }
}

function statusicon(res) {
    if (res.toString() == 'true') {
        return `<i class="fa-regular fa-square-check fa-2x text-success" data-toggle="tooltip" title="Completed"></i>`;
    } else {
        return `<i class="fa-regular fa-circle-xmark fa-2x text-danger" data-toggle="tooltip" title="Pending"></i>`; 
    }
}

function makeapicall(methodName, api_url, body = null, successcb, errorcb) {
    if (loader) loader.style.display = 'flex'; 
    
    let xhr = new XMLHttpRequest();
    xhr.open(methodName, api_url);
    xhr.send(body ? JSON.stringify(body) : null);
    
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status <= 299) {
            let res = JSON.parse(xhr.response);
            if (methodName == 'GET') {
                successcb(res);
            } else if (methodName == 'POST') {
                body.id = res.name;
                successcb(body);
            } else if (methodName == 'PUT' || methodName == 'PATCH') {
                successcb(res);
            } else {
                successcb();
            }
        } else {
            let err = JSON.parse(xhr.response);
            errorcb(err, 'error');
        }
        if (loader) loader.style.display = 'none'; 
    };

    xhr.onerror = function() {
        if (loader) loader.style.display = 'none'; 
        errorcb('Network Error!', 'error');
    };
}

function fetchCommentsList() {
    makeapicall('GET', COMMENT_URL, null, createTable, snackbar);
}

fetchCommentsList();

function createTable(dataObj, highlightId = null) {
    commentsArr = []; 
    
    if (dataObj) {
        let keys = Object.keys(dataObj);
        keys.forEach(key => {
            commentsArr.push({
                id: key,
                ...dataObj[key]
            });
        });
    }

    let result = ``;

    if (commentsArr.length === 0) {
        if (commentTableBody) commentTableBody.innerHTML = `<tr><td colspan="5" class="text-center font-weight-bold">No Comments Found!</td></tr>`;
        return;
    }

    let totalLength = commentsArr.length;

    commentsArr.forEach((comment, index) => {
        let customId = totalLength - index; 
        
        result += `<tr id="row-${comment.id}">
                    <td><strong>${customId}</strong></td>
                    <td><span data-toggle="tooltip" title="${comment.title}">${comment.title}</span></td>
                    <td><span class="badge badge-dark px-2 py-1">User: ${comment.userId}</span></td>
                    <td>${statusicon(comment.completed)}</td>
                    <td>
                        <button onclick="onEdit('${comment.id}')" class="btn btn-sm btn-outline-info mr-2" data-toggle="tooltip" title="Edit This Comment">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="onRemove('${comment.id}')" class="btn btn-sm btn-outline-danger" data-toggle="tooltip" title="Delete This Comment">
                            <i class="fas fa-trash-alt"></i> Remove
                        </button>
                    </td>
                </tr>`;
    });

    if (commentTableBody) {
        commentTableBody.innerHTML = result;
    }
    
    initTooltips(); 

    if (highlightId) {
        setTimeout(() => {
            let row = document.getElementById(`row-${highlightId}`);
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.classList.add('highlight');
                setTimeout(() => { row.classList.remove('highlight'); }, 4000);
            }
        }, 300);
    }
}

function onCommentSubmit(eve) {
    eve.preventDefault();
    let newComment = {
        title: titleControl.value.trim(),
        userId: userIdControl.value,
        completed: completedControl.value
    };

    makeapicall('POST', COMMENT_URL, newComment, AddRowonUI, snackbar);
}

function AddRowonUI(res) {
    commentForm.reset();
    snackbar(`The Comment With Id ${res.id} Is Added Successfully !!`, 'success');
    
    makeapicall('GET', COMMENT_URL, null, (data) => {
        createTable(data, res.id);
    }, snackbar);
}

function onEdit(id) {
    updateId = id;
    let editURL = `${BASE_URL}/comments/${updateId}.json`;
    makeapicall('GET', editURL, null, populateForm, snackbar);
}

function populateForm(resObj) {
    titleControl.value = resObj.title;
    userIdControl.value = resObj.userId;
    completedControl.value = resObj.completed.toString();

    addBtn.classList.add('d-none');
    updateBtn.classList.remove('d-none');

    commentForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onUpdateComment(eve) {
    if (eve) eve.preventDefault();

    let updateObj = {
        title: titleControl.value.trim(),
        userId: userIdControl.value,
        completed: completedControl.value,
        id: updateId
    };

    let updateURL = `${BASE_URL}/comments/${updateId}.json`;
    makeapicall('PUT', updateURL, updateObj, updateOnUI, snackbar);
}

function updateOnUI(res) {
    let targetId = updateId;
    updateId = null;

    commentForm.reset();
    addBtn.classList.remove('d-none');
    updateBtn.classList.add('d-none');

    snackbar(`The Comment with Id ${res.id} is Updated Successfully!!`, 'success');
    makeapicall('GET', COMMENT_URL, null, (data) => createTable(data, targetId), snackbar);
}

function onRemove(id) {
    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: '#2b754e',
        cancelButtonColor: '#d33',
        confirmButtonText: "Yes, delete it!"
    }).then((result) => {
        if (result.isConfirmed) {
            let removeURL = `${BASE_URL}/comments/${id}.json`;
            makeapicall('DELETE', removeURL, null, () => {
                snackbar(`The Comment Item is Removed !!`, 'success');
                fetchCommentsList();
            }, snackbar);
        }
    });
}

commentForm.addEventListener('submit', onCommentSubmit);
updateBtn.addEventListener('click', onUpdateComment);