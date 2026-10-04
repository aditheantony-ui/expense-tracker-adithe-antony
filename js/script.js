"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       STORAGE
    ========================================= */

    const STORAGE_KEY = "expenseTrackerTransactions";

    let transactions = [];
    let editingTransactionId = null;
    let expenseChartInstance = null;


    /* =========================================
       DOM ELEMENTS
    ========================================= */

    const transactionForm =
        document.getElementById("transaction-form");

    const transactionType =
        document.getElementById("transaction-type");

    const amountInput =
        document.getElementById("amount");

    const categoryInput =
        document.getElementById("category");

    const dateInput =
        document.getElementById("date");

    const descriptionInput =
        document.getElementById("description");

    const submitButton =
        document.getElementById("submit-button");

    const cancelEditButton =
        document.getElementById("cancel-edit");


    /* ERROR ELEMENTS */

    const typeError =
        document.getElementById("type-error");

    const amountError =
        document.getElementById("amount-error");

    const categoryError =
        document.getElementById("category-error");

    const dateError =
        document.getElementById("date-error");

    const descriptionError =
        document.getElementById("description-error");


    /* DASHBOARD */

    const totalIncome =
        document.getElementById("total-income");

    const totalExpenses =
        document.getElementById("total-expenses");

    const currentBalance =
        document.getElementById("current-balance");


    /* FILTERS */

    const typeFilter =
        document.getElementById("type-filter");

    const categoryFilter =
        document.getElementById("category-filter");

    const clearFiltersButton =
        document.getElementById("clear-filters");


    /* TRANSACTIONS */

    const transactionList =
        document.getElementById("transaction-list");


    /* MONTHLY ANALYTICS */

    const summaryMonth =
        document.getElementById("summary-month");

    const monthlyTotal =
        document.getElementById("monthly-total");

    const monthlyCategoryList =
        document.getElementById("monthly-category-list");


    /* CHART */

    const expenseChart =
        document.getElementById("expense-chart");

    const chartEmpty =
        document.getElementById("chart-empty");


    /* =========================================
       INITIALIZE
    ========================================= */

    loadTransactions();

    setDefaultDate();

    setDefaultMonth();

    updateApplication();


    /* =========================================
       EVENT LISTENERS
    ========================================= */

    transactionForm.addEventListener(
        "submit",
        handleFormSubmit
    );


    cancelEditButton.addEventListener(
        "click",
        cancelEdit
    );


    typeFilter.addEventListener(
        "change",
        renderTransactions
    );


    categoryFilter.addEventListener(
        "change",
        renderTransactions
    );


    clearFiltersButton.addEventListener(
        "click",
        clearFilters
    );


    /*
       IMPORTANT:
       Changing the month now updates BOTH
       the monthly summary AND the chart.
    */

    summaryMonth.addEventListener(
        "change",
        () => {

            updateMonthlySummary();

            updateExpenseChart();

        }
    );


    /* =========================================
       LOCAL STORAGE
    ========================================= */

    function loadTransactions() {

        try {

            const savedData =
                localStorage.getItem(STORAGE_KEY);


            if (!savedData) {

                transactions = [];

                return;
            }


            const parsedData =
                JSON.parse(savedData);


            if (!Array.isArray(parsedData)) {

                transactions = [];

                return;
            }


            transactions =
                parsedData
                    .filter(
                        transaction =>
                            transaction &&
                            transaction.id
                    )
                    .map(transaction => ({

                        id:
                            String(
                                transaction.id
                            ),

                        type:
                            transaction.type ===
                            "expense"
                                ? "expense"
                                : "income",

                        amount:
                            Number(
                                transaction.amount
                            ),

                        category:
                            String(
                                transaction.category ||
                                ""
                            ).trim(),

                        date:
                            String(
                                transaction.date ||
                                ""
                            ),

                        description:
                            String(
                                transaction.description ||
                                ""
                            ).trim()

                    }))
                    .filter(transaction =>
                        Number.isFinite(
                            transaction.amount
                        ) &&
                        transaction.amount > 0 &&
                        transaction.category &&
                        transaction.date &&
                        transaction.description
                    );

        }

        catch (error) {

            console.error(
                "Error loading transactions:",
                error
            );

            transactions = [];

        }
    }


    function saveTransactions() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(transactions)
            );

        }

        catch (error) {

            console.error(
                "Error saving transactions:",
                error
            );

            alert(
                "Unable to save your transaction. Please check your browser storage settings."
            );
        }
    }


    /* =========================================
       FORM SUBMISSION
    ========================================= */

    function handleFormSubmit(event) {

        event.preventDefault();

        clearErrors();


        const formData = {

            type:
                transactionType.value,

            amount:
                amountInput.value,

            category:
                categoryInput.value.trim(),

            date:
                dateInput.value,

            description:
                descriptionInput.value.trim()

        };


        if (!validateForm(formData)) {

            return;
        }


        if (editingTransactionId) {

            updateTransaction(formData);

        }

        else {

            addTransaction(formData);

        }
    }


    /* =========================================
       VALIDATION
    ========================================= */

    function validateForm(data) {

        let valid = true;


        if (
            data.type !== "income" &&
            data.type !== "expense"
        ) {

            showError(
                typeError,
                "Please select a transaction type."
            );

            valid = false;
        }


        const amount =
            Number(data.amount);


        if (
            data.amount === "" ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            showError(
                amountError,
                "Please enter an amount greater than ₹0."
            );

            valid = false;
        }


        if (!data.category) {

            showError(
                categoryError,
                "Please enter a category."
            );

            valid = false;
        }


        if (!data.date) {

            showError(
                dateError,
                "Please select a date."
            );

            valid = false;

        }

        else if (!isValidDate(data.date)) {

            showError(
                dateError,
                "Please enter a valid date."
            );

            valid = false;
        }


        if (!data.description) {

            showError(
                descriptionError,
                "Please enter a description."
            );

            valid = false;
        }


        return valid;
    }


    function isValidDate(dateString) {

        const date =
            new Date(
                `${dateString}T00:00:00`
            );

        return !Number.isNaN(
            date.getTime()
        );
    }


    function showError(
        element,
        message
    ) {

        element.textContent =
            message;
    }


    function clearErrors() {

        typeError.textContent = "";

        amountError.textContent = "";

        categoryError.textContent = "";

        dateError.textContent = "";

        descriptionError.textContent = "";
    }


    /* =========================================
       ADD TRANSACTION
    ========================================= */

    function addTransaction(data) {

        const transaction = {

            id:
                Date.now().toString() +
                Math.random()
                    .toString(36)
                    .slice(2, 8),

            type:
                data.type,

            amount:
                Number(
                    Number(
                        data.amount
                    ).toFixed(2)
                ),

            category:
                data.category,

            date:
                data.date,

            description:
                data.description
        };


        transactions.push(transaction);

        saveTransactions();

        resetForm();

        updateApplication();
    }


    /* =========================================
       EDIT TRANSACTION
    ========================================= */

    function startEdit(transactionId) {

        const transaction =
            transactions.find(
                item =>
                    item.id ===
                    transactionId
            );


        if (!transaction) {

            return;
        }


        editingTransactionId =
            transaction.id;


        transactionType.value =
            transaction.type;

        amountInput.value =
            transaction.amount;

        categoryInput.value =
            transaction.category;

        dateInput.value =
            transaction.date;

        descriptionInput.value =
            transaction.description;


        submitButton.textContent =
            "Update Transaction";


        cancelEditButton.hidden =
            false;


        clearErrors();


        transactionForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    /* =========================================
       UPDATE TRANSACTION
    ========================================= */

    function updateTransaction(data) {

        const index =
            transactions.findIndex(
                transaction =>
                    transaction.id ===
                    editingTransactionId
            );


        if (index === -1) {

            cancelEdit();

            return;
        }


        transactions[index] = {

            ...transactions[index],

            type:
                data.type,

            amount:
                Number(
                    Number(
                        data.amount
                    ).toFixed(2)
                ),

            category:
                data.category,

            date:
                data.date,

            description:
                data.description
        };


        saveTransactions();

        cancelEdit();

        updateApplication();
    }


    /* =========================================
       CANCEL EDIT
    ========================================= */

    function cancelEdit() {

        editingTransactionId = null;

        resetForm();

        submitButton.textContent =
            "Add Transaction";

        cancelEditButton.hidden =
            true;

        clearErrors();
    }


    /* =========================================
       RESET FORM
    ========================================= */

    function resetForm() {

        transactionForm.reset();

        transactionType.value =
            "income";

        setDefaultDate();

        clearErrors();
    }


    /* =========================================
       DELETE TRANSACTION
    ========================================= */

    function deleteTransaction(transactionId) {

        const transaction =
            transactions.find(
                item =>
                    item.id ===
                    transactionId
            );


        if (!transaction) {

            return;
        }


        const confirmation =
            window.confirm(
                `Delete this ${transaction.type} transaction of ${formatCurrency(transaction.amount)}?`
            );


        if (!confirmation) {

            return;
        }


        transactions =
            transactions.filter(
                item =>
                    item.id !==
                    transactionId
            );


        if (
            editingTransactionId ===
            transactionId
        ) {

            cancelEdit();
        }


        saveTransactions();

        updateApplication();
    }


    /* =========================================
       RENDER TRANSACTIONS
    ========================================= */

    function renderTransactions() {

        const filtered =
            getFilteredTransactions();


        transactionList.innerHTML =
            "";


        if (filtered.length === 0) {

            const emptyState =
                document.createElement(
                    "div"
                );


            emptyState.className =
                "empty-state";


            emptyState.innerHTML = `
                <h3>No transactions found</h3>

                <p>
                    Add a transaction or change your filters to see your activity here.
                </p>
            `;


            transactionList.appendChild(
                emptyState
            );


            return;
        }


        filtered.forEach(
            transaction => {

                const element =
                    createTransactionElement(
                        transaction
                    );


                transactionList.appendChild(
                    element
                );
            }
        );
    }


    function createTransactionElement(
        transaction
    ) {

        const item =
            document.createElement(
                "article"
            );


        item.className =
            `transaction-item ${transaction.type}`;


        const content =
            document.createElement(
                "div"
            );


        content.className =
            "transaction-content";


        const category =
            document.createElement(
                "span"
            );


        category.className =
            "transaction-category";


        category.textContent =
            transaction.category;


        const description =
            document.createElement(
                "h3"
            );


        description.textContent =
            transaction.description;


        const date =
            document.createElement(
                "time"
            );


        date.className =
            "transaction-date";


        date.textContent =
            formatDate(
                transaction.date
            );


        content.appendChild(
            category
        );

        content.appendChild(
            description
        );

        content.appendChild(
            date
        );


        const right =
            document.createElement(
                "div"
            );


        right.className =
            "transaction-right";


        const amount =
            document.createElement(
                "strong"
            );


        amount.className =
            "transaction-amount";


        const sign =
            transaction.type ===
            "income"
                ? "+"
                : "-";


        amount.textContent =
            `${sign}${formatCurrency(transaction.amount)}`;


        right.appendChild(
            amount
        );


        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "transaction-actions";


        const editButton =
            document.createElement(
                "button"
            );


        editButton.type =
            "button";

        editButton.className =
            "edit-button";

        editButton.textContent =
            "Edit";


        editButton.addEventListener(
            "click",
            () =>
                startEdit(
                    transaction.id
                )
        );


        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.type =
            "button";

        deleteButton.className =
            "delete-button";

        deleteButton.textContent =
            "Delete";


        deleteButton.addEventListener(
            "click",
            () =>
                deleteTransaction(
                    transaction.id
                )
        );


        actions.appendChild(
            editButton
        );

        actions.appendChild(
            deleteButton
        );


        right.appendChild(
            actions
        );


        item.appendChild(
            content
        );

        item.appendChild(
            right
        );


        return item;
    }


    /* =========================================
       FILTERS
    ========================================= */

    function getFilteredTransactions() {

        const selectedType =
            typeFilter.value;

        const selectedCategory =
            categoryFilter.value;


        return [...transactions]

            .filter(transaction => {

                if (
                    selectedType !== "all" &&
                    transaction.type !==
                    selectedType
                ) {

                    return false;
                }


                if (
                    selectedCategory !== "all" &&
                    transaction.category.toLowerCase() !==
                    selectedCategory.toLowerCase()
                ) {

                    return false;
                }


                return true;
            })


            .sort((a, b) => {

                const dateA =
                    new Date(
                        `${a.date}T00:00:00`
                    );

                const dateB =
                    new Date(
                        `${b.date}T00:00:00`
                    );


                return dateB - dateA;
            });
    }


    function updateCategoryFilter() {

        const currentValue =
            categoryFilter.value;


        const categories =
            [
                ...new Set(
                    transactions
                        .map(
                            transaction =>
                                transaction.category
                        )
                        .filter(Boolean)
                )
            ];


        categories.sort(
            (a, b) =>
                a.localeCompare(b)
        );


        categoryFilter.innerHTML =
            "";


        const allOption =
            document.createElement(
                "option"
            );


        allOption.value =
            "all";

        allOption.textContent =
            "All Categories";


        categoryFilter.appendChild(
            allOption
        );


        categories.forEach(
            category => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category;

                option.textContent =
                    category;


                categoryFilter.appendChild(
                    option
                );
            }
        );


        const matching =
            categories.find(
                category =>
                    category.toLowerCase() ===
                    currentValue.toLowerCase()
            );


        categoryFilter.value =
            matching || "all";
    }


    function clearFilters() {

        typeFilter.value =
            "all";

        categoryFilter.value =
            "all";

        renderTransactions();
    }


    /* =========================================
       DASHBOARD
    ========================================= */

    function updateDashboard() {

        let income = 0;

        let expenses = 0;


        transactions.forEach(
            transaction => {

                if (
                    transaction.type ===
                    "income"
                ) {

                    income +=
                        transaction.amount;

                } else {

                    expenses +=
                        transaction.amount;
                }
            }
        );


        const balance =
            income - expenses;


        totalIncome.textContent =
            formatCurrency(income);

        totalExpenses.textContent =
            formatCurrency(expenses);

        currentBalance.textContent =
            formatCurrency(balance);
    }


    /* =========================================
       MONTHLY SUMMARY
    ========================================= */

    function updateMonthlySummary() {

        const selectedMonth =
            summaryMonth.value;


        if (!selectedMonth) {

            monthlyTotal.textContent =
                formatCurrency(0);

            monthlyCategoryList.innerHTML =
                "";

            return;
        }


        const monthlyExpenses =
            transactions.filter(
                transaction =>
                    transaction.type ===
                        "expense" &&
                    transaction.date.startsWith(
                        selectedMonth
                    )
            );


        const total =
            monthlyExpenses.reduce(
                (sum, transaction) =>
                    sum +
                    transaction.amount,
                0
            );


        monthlyTotal.textContent =
            formatCurrency(total);


        monthlyCategoryList.innerHTML =
            "";


        if (
            monthlyExpenses.length ===
            0
        ) {

            const empty =
                document.createElement(
                    "p"
                );


            empty.className =
                "monthly-empty";


            empty.textContent =
                "No expenses recorded for this month.";


            monthlyCategoryList.appendChild(
                empty
            );


            return;
        }


        const categoryTotals = {};


        monthlyExpenses.forEach(
            transaction => {

                const category =
                    transaction.category;


                categoryTotals[category] =
                    (
                        categoryTotals[category] ||
                        0
                    ) +
                    transaction.amount;
            }
        );


        const sorted =
            Object.entries(
                categoryTotals
            ).sort(
                (a, b) =>
                    b[1] - a[1]
            );


        sorted.forEach(
            ([category, amount]) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "monthly-category-item";


                const name =
                    document.createElement(
                        "span"
                    );


                name.textContent =
                    category;


                const value =
                    document.createElement(
                        "strong"
                    );


                value.textContent =
                    formatCurrency(amount);


                row.appendChild(name);

                row.appendChild(value);


                monthlyCategoryList.appendChild(
                    row
                );
            }
        );
    }


    /* =========================================
       EXPENSE CHART
       IMPORTANT:
       Chart now follows selected month.
    ========================================= */

    function updateExpenseChart() {

        if (!expenseChart) {

            return;
        }


        const selectedMonth =
            summaryMonth.value;


        /*
           Only expenses from the
           selected month are included.
        */

        const monthlyExpenses =
            transactions.filter(
                transaction =>
                    transaction.type ===
                        "expense" &&
                    transaction.date.startsWith(
                        selectedMonth
                    )
            );


        const categoryTotals = {};


        monthlyExpenses.forEach(
            transaction => {

                const category =
                    transaction.category;


                categoryTotals[category] =
                    (
                        categoryTotals[category] ||
                        0
                    ) +
                    transaction.amount;
            }
        );


        const entries =
            Object.entries(
                categoryTotals
            ).sort(
                (a, b) =>
                    b[1] - a[1]
            );


        /*
           Chart.js unavailable
        */

        if (
            typeof Chart ===
            "undefined"
        ) {

            expenseChart.style.display =
                "none";


            chartEmpty.hidden =
                false;


            chartEmpty.textContent =
                "Chart could not be loaded. Please check your internet connection.";


            destroyChart();

            return;
        }


        /*
           No expenses in selected month
        */

        if (entries.length === 0) {

            expenseChart.style.display =
                "none";


            chartEmpty.hidden =
                false;


            chartEmpty.textContent =
                "No expenses recorded for this month.";


            destroyChart();

            return;
        }


        /*
           Show chart
        */

        expenseChart.style.display =
            "block";


        chartEmpty.hidden =
            true;


        /*
           Destroy previous chart
        */

        destroyChart();


        const labels =
            entries.map(
                ([category]) =>
                    category
            );


        const data =
            entries.map(
                ([, amount]) =>
                    amount
            );


        /*
           Create new chart
        */

        expenseChartInstance =
            new Chart(
                expenseChart,
                {

                    type: "doughnut",


                    data: {

                        labels: labels,

                        datasets: [

                            {

                                data: data,

                                borderWidth: 0,

                                hoverOffset: 7

                            }

                        ]
                    },


                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        cutout: "68%",


                        plugins: {

                            legend: {

                                position:
                                    "bottom",


                                labels: {

                                    padding: 18,

                                    usePointStyle:
                                        true,

                                    font: {

                                        size: 12
                                    }
                                }
                            },


                            tooltip: {

                                callbacks: {

                                    label:
                                        function(
                                            context
                                        ) {

                                            return (
                                                ` ${context.label}: ` +
                                                formatCurrency(
                                                    context.raw
                                                )
                                            );
                                        }
                                }
                            }
                        }
                    }
                }
            );
    }


    function destroyChart() {

        if (
            expenseChartInstance
        ) {

            expenseChartInstance.destroy();

            expenseChartInstance =
                null;
        }
    }


    /* =========================================
       UPDATE ENTIRE APPLICATION
    ========================================= */

    function updateApplication() {

        updateCategoryFilter();

        renderTransactions();

        updateDashboard();

        updateMonthlySummary();

        updateExpenseChart();
    }


    /* =========================================
       DEFAULT DATE
    ========================================= */

    function setDefaultDate() {

        if (!dateInput.value) {

            dateInput.value =
                getTodayString();
        }
    }


    function setDefaultMonth() {

        if (!summaryMonth.value) {

            summaryMonth.value =
                getCurrentMonthString();
        }
    }


    function getTodayString() {

        const today =
            new Date();


        const year =
            today.getFullYear();


        const month =
            String(
                today.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                today.getDate()
            ).padStart(
                2,
                "0"
            );


        return `${year}-${month}-${day}`;
    }


    function getCurrentMonthString() {

        return getTodayString().slice(
            0,
            7
        );
    }


    /* =========================================
       FORMATTING
    ========================================= */

    function formatCurrency(amount) {

        return new Intl.NumberFormat(
            "en-IN",
            {

                style: "currency",

                currency: "INR",

                minimumFractionDigits: 2,

                maximumFractionDigits: 2
            }
        ).format(amount);
    }


    function formatDate(dateString) {

        const parts =
            dateString.split("-");


        if (
            parts.length !== 3
        ) {

            return dateString;
        }


        const year =
            Number(parts[0]);

        const month =
            Number(parts[1]) - 1;

        const day =
            Number(parts[2]);


        const date =
            new Date(
                year,
                month,
                day
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return dateString;
        }


        return new Intl.DateTimeFormat(
            "en-IN",
            {

                day: "2-digit",

                month: "short",

                year: "numeric"
            }
        ).format(date);
    }

});