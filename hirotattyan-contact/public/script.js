const inquiryType= document.getElementById("inquiry-type");

const conditionalFields = {
    "new-website": document.getElementById("new-website-fields"),
    "website-renewal": document.getElementById("website-renewal-fields"),
    "wordpress":document.getElementById("wordpress-fields")
};

function updateFields() {
    const selectedType = inquiryType.selectedOptions[0]?.dataset.fieldType || "";

    for(const [type, field] of Object.entries(conditionalFields)) {
        const isActive = type ===selectedType;

        field.hidden = !isActive;

        const inputs = field.querySelectorAll("input,select,textarea");

        inputs.forEach((input) => {
            input.disabled = !isActive;
        });
    }
}

inquiryType.addEventListener("change",updateFields);

updateFields();