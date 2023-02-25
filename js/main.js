let currencyFormatter = Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  
  let entryCounter = 0;
  let entries = [];
  
  $(document).ready(() => {
    $(".modal").modal({
      onCloseEnd: () => {
        $(".modal input").each((_, i) => {
          $(i).val("");
          $(i).removeClass("invalid");
          $(i).removeClass("valid");
        });
        $(".modal label").each((_, l) => {
          $(l).removeClass("active");
        });
      },
    });
  
    $("#addEntryBtn").on("click", addEntryHandler);
    $("#saveEntryBtn").on("click", saveModifiedEntryHandler);
    $("#deleteEntryBtn").on("click", deleteEntryHandler);
  });
  
  let openAddEntryModalHandler = (evt) => {
    console.log(evt.target.dataset.category);
    if (evt.target.dataset.category === "income") {
      $("#entryType").text("Income");
      $("#addEntryModal form").attr("data-category", "income");
    } else if (evt.target.dataset.category === "expense") {
      $("#entryType").text("Expense");
      $("#addEntryModal form").attr("data-category", "expense");
    }
    $("#addEntryModal").modal("open");
  };
  
  [$("#addIncomeBtn"), $("#addExpenseBtn")].forEach((b) => {
    b.on("click", openAddEntryModalHandler);
  });
  
  // Add Entry Function
  let addEntry = (description, amount, category) => {
    let entryObj = {
      id: entryCounter,
      description: description,
      amount: amount,
      category: category,
    };
  
    entries.push(entryObj);
    saveEntries();
  
    if (category === "expense") {
      amount = -Math.abs(amount);
    }
    let newEntry = $(`<tr data-entryid="${entryCounter}">`);
    newEntry.html(`<td data-description data-entryid="${entryCounter}">
          ${description}
      </td>
      <td data-amount data-entryid="${entryCounter}">
          ${currencyFormatter.format(amount)}
      </td>`);
    $(`tbody[data-category="${category}"]`).append(newEntry);
  
    newEntry.on("click", modifyEntryHandler);
  
    entryCounter++;
  
    updateDashboard();
  };
  
  // Add Entry Button Handler
  let addEntryHandler = (evt) => {
    // Gather inputs
    let description = $("#description").val();
    let amount = $("#amount").val();
    let category = $(".modal form")[0].dataset.category;
  
    // Income must be a positive non-zero number
    // Expense can accept positive or negative (handling abs val on the backend)
  
    // Check if description is greater than 3 or more characters
    //If not, popup a toast message
    if (description.length < 3) {
      M.toast({
        html: "Enter at least 3 letters for description.",
        classes: "red",
      });
      return false;
    }
  
    // Check for zero amount input
    if (amount === 0 || amount === "") {
      M.toast({
        html: "Amount must not be 0.",
        classes: "red",
      });
      return false;
    }
  
    // Check if income amount is negative
    if (category === "income" && amount < 0) {
      M.toast({
        html: "Income amount must be a postive number.",
        classes: "red",
      });
      return false;
    }
  
    addEntry(description, amount, category);
    $(".modal").modal("close");
  };
  
  let modifyEntryHandler = (evt) => {
    let description = $($(evt.target).closest("tr").children()[0]).text().trim();
    let amount = $($(evt.target).closest("tr").children()[1]).text().trim();
    let category = $(evt.target).closest("tbody")[0].dataset.category;
    let id = $(evt.target).closest("tr")[0].dataset.entryid;
  
    $("#editDeleteEntryModal").modal("open");
    $("#editDescription").val(description).addClass("valid");
    $("#editAmount").val(convertCurrencyFormatToFloat(amount)).addClass("valid");
    $(`label[for="editAmount"]`).addClass("active");
    $(`label[for="editDescription"]`).addClass("active");
    $(`#editDeleteEntryModal form`).attr("data-category", category);
    $(`#editDeleteEntryModal form`).attr("data-entryid", id);
  };
  
  let saveModifiedEntryHandler = (evt) => {
    console.log($(`#editDeleteEntryModal form`)[0].dataset.category);
    let category = $(`#editDeleteEntryModal form`)[0].dataset.category;
    let description = $("#editDescription").val();
    let amount = $("#editAmount").val();
    let id = $(`#editDeleteEntryModal form`)[0].dataset.entryid;
    console.log(category, description, amount, id);
  
    if (validateInputs(description, amount, category)) {
      saveModifiedEntry(description, amount, category, id);
      $("#editDeleteEntryModal").modal("close");
    }
  };
  
  let saveModifiedEntry = (description, amount, category, id) => {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].id == id) {
        entries[i].description = description;
        entries[i].amount = amount;
      }
    }
    saveEntries();
  
    if (category === "expense") {
      amount = -Math.abs(amount);
    }
  
    let descriptionEl = $(`tr[data-entryid="${id}"] td[data-description]`);
    let amountEl = $(`tr[data-entryid="${id}"] td[data-amount]`);
  
    descriptionEl.text(description);
    amountEl.text(currencyFormatter.format(amount));
    updateDashboard();
  };
  
  let deleteEntryHandler = (evt) => {
    let id = $("#editDeleteEntryModal form")[0].dataset.entryid;
    $(`tr[data-entryid="${id}"`).hide();
    $("#editDeleteEntryModal").modal("close");
    let myToast = M.toast({
      html: `<span>Entry deleted.</span><button class="btn-flat toast-action">UNDO</button>`,
      classes: "orange",
      // completeCallback: () => deleteEntry(id),
    });
    let deleteTimeout = setTimeout(() => {
      deleteEntry(id);
    }, myToast.options.displayLength);
    $(".toast-action").on("click", () => {
      window.clearTimeout(deleteTimeout);
      myToast.dismiss();
      $(`tr[data-entryid="${id}"`).show();
      updateDashboard();
    });
    updateDashboard();
  };
  
  let deleteEntry = (id) => {
    $(`tr[data-entryid="${id}"]`).remove();
  
    let newEntries = [];
    for (let i = 0; i < entries.length; i++) {
      if (!entries[i].id == id) {
        newEntries.push(entries[i]);
      }
    }
    entries = newEntries;
    saveEntries();
  };
  
  let updateDashboard = () => {
    // Calculate income
    let income = 0;
    $(`tbody[data-category="income"] td[data-amount]`).each((i, j) => {
      if (!($($(j).closest("tr")[0]).attr("style") === "display: none;")) {
        income += convertCurrencyFormatToFloat($(j).text());
      }
    });
  
    // Update income on DOM
    $("#totalIncome").text(currencyFormatter.format(income));
    $("#totalIncome").addClass("green-text");
  
    // Calculate expense
    let expense = 0;
    $(`tbody[data-category="expense"] td[data-amount]`).each((i, j) => {
      if (!($($(j).closest("tr")[0]).attr("style") === "display: none;")) {
        expense += convertCurrencyFormatToFloat($(j).text());
      }
    });
  
    // Update expense on DOM
    $("#totalExpense").text(currencyFormatter.format(expense));
    $("#totalExpense").addClass("red-text");
  
    // Calculate leftover
    let leftover = income - Math.abs(expense);
  
    // Update leftover on DOM
    $("#leftover").text(currencyFormatter.format(leftover));
    if (leftover < 0) {
      $("#leftover").removeClass("green-text");
      $("#leftover").addClass("red-text");
    } else if (leftover > 0) {
      $("#leftover").addClass("green-text");
      $("#leftover").removeClass("red-text");
    } else {
      $("#leftover").removeClass(["green-text", "red-text"]);
    }
  };
  
  let saveEntries = () => {
    localStorage.setItem("entries", JSON.stringify(entries));
  };
  
  let loadEntries = () => {
    let savedEntries = JSON.parse(localStorage.getItem("entries")) || [];
    if (savedEntries.length > 0) {
      savedEntries.forEach((e) => {
        addEntry(e.description, e.amount, e.category);
      });
    }
  };
  
  // Utility Functions
  let convertCurrencyFormatToFloat = (currency) => {
    currency = currency.replace("$", "");
    currency = currency.replace(",", "");
    currency = parseFloat(currency);
    return currency;
  };
  
  let validateInputs = (description, amount, category) => {
    // Check if description is greater than 3 or more characters
    if (description.length < 3) {
      M.toast({
        html: "Enter at least 3 letters for description.",
        classes: "red",
      });
      return false;
    }
  
    // Check for zero amount input
    if (amount === 0 || amount === "") {
      M.toast({
        html: "Amount must not be 0.",
        classes: "red",
      });
      return false;
    }
  
    // Check if income amount is negative
    if (category === "income" && amount < 0) {
      M.toast({
        html: "Income amount must be a postive number.",
        classes: "red",
      });
      return false;
    }
  
    return true;
  };
  
  loadEntries();
  updateDashboard();