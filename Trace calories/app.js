(function () {
  'use strict';

  // ============= Storage Controller =============
  // Handles saving/loading meal items to/from the browser's localStorage
  const StorageCtrl = (function () {
    return {
      storeItem: function (item) {
        let items;
        if (localStorage.getItem('items') === null) {
          items = [];
          items.push(item);
          localStorage.setItem('items', JSON.stringify(items));
        } else {
          items = JSON.parse(localStorage.getItem('items'));
          items.push(item);
          localStorage.setItem('items', JSON.stringify(items));
        }
      },
      getItemsFromStorage: function () {
        let items;
        if (localStorage.getItem('items') === null) {
          items = [];
        } else {
          items = JSON.parse(localStorage.getItem('items'));
        }
        return items;
      },
      updateItemStorage: function (updatedItem) {
        let items = JSON.parse(localStorage.getItem('items'));
        items.forEach((item, index) => {
          if (updatedItem.id === item.id) {
            items.splice(index, 1, updatedItem);
          }
        });
        localStorage.setItem('items', JSON.stringify(items));
      },
      deleteItemFromStorage: function (id) {
        let items = JSON.parse(localStorage.getItem('items'));
        items.forEach((item, index) => {
          if (id === item.id) {
            items.splice(index, 1);
          }
        });
        localStorage.setItem('items', JSON.stringify(items));
      },
      clearItemsFromStorage: function () {
        localStorage.removeItem('items');
      }
    };
  })();

  // ============= Item Controller =============
  // Holds the in-memory list of meal items and keeps the running total
  const ItemCtrl = (function () {
    const Item = function (id, name, calories) {
      this.id = id;
      this.name = name;
      this.calories = calories;
    };

    const data = {
      items: StorageCtrl.getItemsFromStorage(),
      currentItem: undefined,
      totalCalories: 0
    };

    return {
      getItems: function () {
        return data.items;
      },
      // Adds a new meal + its calories to the list
      addItem: function (name, calories) {
        let ID;
        if (data.items.length > 0) {
          ID = data.items[data.items.length - 1].id + 1;
        } else {
          ID = 0;
        }
        calories = parseInt(calories);
        const newItem = new Item(ID, name, calories);
        data.items.push(newItem);
        return newItem;
      },
      getItemById: function (id) {
        let found = '';
        data.items.forEach(item => {
          if (item.id === id) found = item;
        });
        return found;
      },
      updatedItem: function (name, calories) {
        calories = parseInt(calories);
        let found = '';
        data.items.forEach(item => {
          if (item.id === data.currentItem.id) {
            item.name = name;
            item.calories = calories;
            found = item;
          }
        });
        return found;
      },
      deleteItem: function (item) {
        const ids = data.items.map(item => item.id);
        const index = ids.indexOf(item.id);
        data.items.splice(index, 1);
      },
      clearAllItems: function () {
        data.items = [];
      },
      setCurrentItem: function (item) {
        data.currentItem = item;
      },
      getCurrentItem: function () {
        return data.currentItem;
      },
      // Sums every item's calories into one running total
      getTotalCalories: function () {
        let total = 0;
        data.items.forEach(item => {
          total += item.calories;
        });
        data.totalCalories = total;
        return data.totalCalories;
      }
    };
  })();

  // ============= UI Controller =============
  // Reads from and writes to the DOM
  const UICtrl = (function () {
    const UISelectors = {
      itemList: '#item-list',
      listItems: '#item-list li',
      addBtn: '.add-btn',
      updateBtn: '.update-btn',
      deleteBtn: '.delete-btn',
      backBtn: '.back-btn',
      clearBtn: '.clear-btn',
      itemNameInput: '#item-name',
      itemCaloriesInput: '#item-calories',
      totalCalories: '.total-calories',
      alert: '.alert'
    };

    return {
      populateItemsList: function (items) {
        let html = '';
        items.forEach(item => {
          html += `<li class="collection-item" id="item-${item.id}">
            <span><strong>${escapeHtml(item.name)}: </strong><em>${item.calories} Calories</em></span>
            <a href="#" class="edit-item">✎</a>
          </li>`;
        });
        document.querySelector(UISelectors.itemList).innerHTML = html;
      },
      showAlert: function (className, message) {
        UICtrl.clearAlert();
        const alert = document.querySelector(UISelectors.alert);
        alert.textContent = message;
        alert.classList.add(className);
        setTimeout(() => {
          UICtrl.clearAlert();
        }, 2000);
      },
      clearAlert: function () {
        const currentAlert = document.querySelector(UISelectors.alert);
        currentAlert.classList.remove('alert-danger');
        currentAlert.classList.remove('alert-success');
        currentAlert.textContent = '';
      },
      getItemsInput: function () {
        return {
          name: document.querySelector(UISelectors.itemNameInput).value,
          calories: document.querySelector(UISelectors.itemCaloriesInput).value
        };
      },
      // Appends a single new meal <li> to the list on screen
      addListItem: function (item) {
        document.querySelector(UISelectors.itemList).style.display = 'block';
        const li = document.createElement('li');
        li.className = 'collection-item';
        li.id = `item-${item.id}`;
        li.innerHTML = `<span><strong>${escapeHtml(item.name)}: </strong><em>${item.calories} Calories</em></span>
          <a href="#" class="edit-item">✎</a>`;
        document.querySelector(UISelectors.itemList).insertAdjacentElement('beforeend', li);
      },
      updateListItem: function (item) {
        let listItems = document.querySelectorAll(UISelectors.listItems);
        listItems = Array.from(listItems);
        listItems.forEach(listItem => {
          const itemID = listItem.getAttribute('id');
          if (itemID === `item-${item.id}`) {
            document.querySelector(`#${itemID}`).innerHTML =
              `<span><strong>${escapeHtml(item.name)}: </strong><em>${item.calories} Calories</em></span>
              <a href="#" class="edit-item">✎</a>`;
          }
        });
      },
      deleteListItem: function (id) {
        const itemID = `#item-${id}`;
        const item = document.querySelector(itemID);
        if (item) item.remove();
      },
      clearInput: function () {
        document.querySelector(UISelectors.itemNameInput).value = '';
        document.querySelector(UISelectors.itemCaloriesInput).value = '';
      },
      addItemToForm: function () {
        document.querySelector(UISelectors.itemNameInput).value = ItemCtrl.getCurrentItem().name;
        document.querySelector(UISelectors.itemCaloriesInput).value = ItemCtrl.getCurrentItem().calories;
        UICtrl.showEditState();
      },
      removeItems: function () {
        let listItems = document.querySelectorAll(UISelectors.listItems);
        listItems = Array.from(listItems);
        listItems.forEach(item => item.remove());
      },
      hideList: function () {
        document.querySelector(UISelectors.itemList).style.display = 'none';
      },
      // Writes the running total onto the page, under the "Total Calories" heading
      showTotalCalories: function (totalCalories) {
        document.querySelector(UISelectors.totalCalories).textContent = totalCalories;
      },
      clearEditState: function () {
        UICtrl.clearInput();
        document.querySelector(UISelectors.updateBtn).style.display = 'none';
        document.querySelector(UISelectors.deleteBtn).style.display = 'none';
        document.querySelector(UISelectors.backBtn).style.display = 'none';
        document.querySelector(UISelectors.addBtn).style.display = 'inline-flex';
      },
      showEditState: function () {
        document.querySelector(UISelectors.updateBtn).style.display = 'inline-flex';
        document.querySelector(UISelectors.deleteBtn).style.display = 'inline-flex';
        document.querySelector(UISelectors.backBtn).style.display = 'inline-flex';
        document.querySelector(UISelectors.addBtn).style.display = 'none';
      },
      getSelectors: function () {
        return UISelectors;
      }
    };

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  })();

  // ============= App Controller =============
  // Wires up button clicks / form submit to the Item + UI controllers
  const App = (function (ItemCtrl, StorageCtrl, UICtrl) {
    const loadEventListeners = function () {
      const UISelectors = UICtrl.getSelectors();

      // "Add Meal" form submit -> add the meal and recalculate the total
      document.querySelector('#item-form').addEventListener('submit', itemAddSubmit);

      // Clicking the pencil icon on a meal loads it into the form for editing
      document.querySelector(UISelectors.itemList).addEventListener('click', itemEditClick);

      document.querySelector(UISelectors.updateBtn).addEventListener('click', itemUpdateSubmit);

      document.querySelector(UISelectors.deleteBtn).addEventListener('click', itemDeleteSubmit);

      document.querySelector(UISelectors.backBtn).addEventListener('click', function (e) {
        e.preventDefault();
        UICtrl.clearEditState();
      });

      document.querySelector(UISelectors.clearBtn).addEventListener('click', clearAllItemsClick);
    };

    // Runs every time the "Add Meal" button is clicked / form submitted
    const itemAddSubmit = function (e) {
      e.preventDefault();
      const input = UICtrl.getItemsInput();

      if (input.name !== '' && input.calories !== '') {
        // 1. Add the new meal to the data list
        const newItem = ItemCtrl.addItem(input.name, input.calories);

        // 2. Show it in the list under "Total Calories"
        UICtrl.addListItem(newItem);

        // 3. Recalculate total calories (previous items + the new one)
        const totalCalories = ItemCtrl.getTotalCalories();

        // 4. Display the updated total on the page
        UICtrl.showTotalCalories(totalCalories);

        // 5. Persist to localStorage so it survives a page refresh
        StorageCtrl.storeItem(newItem);

        // 6. Reset the form for the next entry
        UICtrl.clearInput();

        UICtrl.showAlert('alert-success', 'Item added!');
      } else {
        UICtrl.showAlert('alert-danger', 'Invalid input!');
      }
    };

    const itemEditClick = function (e) {
      e.preventDefault();
      if (e.target.classList.contains('edit-item')) {
        const listId = e.target.parentNode.id;
        const listIdArr = listId.split('-');
        const id = parseInt(listIdArr[1]);
        const itemToEdit = ItemCtrl.getItemById(id);
        ItemCtrl.setCurrentItem(itemToEdit);
        UICtrl.addItemToForm();
      }
    };

    const itemUpdateSubmit = function (e) {
      e.preventDefault();
      const input = UICtrl.getItemsInput();
      const updatedItem = ItemCtrl.updatedItem(input.name, input.calories);
      UICtrl.updateListItem(updatedItem);
      const totalCalories = ItemCtrl.getTotalCalories();
      UICtrl.showTotalCalories(totalCalories);
      StorageCtrl.updateItemStorage(updatedItem);
      UICtrl.clearEditState();
    };

    const itemDeleteSubmit = function (e) {
      e.preventDefault();
      const currentItem = ItemCtrl.getCurrentItem();
      ItemCtrl.deleteItem(currentItem);
      UICtrl.deleteListItem(currentItem.id);
      const totalCalories = ItemCtrl.getTotalCalories();
      UICtrl.showTotalCalories(totalCalories);
      StorageCtrl.deleteItemFromStorage(currentItem.id);
      UICtrl.clearEditState();
      const items = ItemCtrl.getItems();
      if (!items.length) {
        UICtrl.hideList();
      }
    };

    const clearAllItemsClick = function (e) {
      e.preventDefault();
      if (!ItemCtrl.getItems().length) {
        UICtrl.showAlert('alert-danger', 'No item to delete');
      } else {
        ItemCtrl.clearAllItems();
        const totalCalories = ItemCtrl.getTotalCalories();
        UICtrl.showTotalCalories(totalCalories);
        UICtrl.removeItems();
        StorageCtrl.clearItemsFromStorage();
        UICtrl.hideList();
      }
    };

    return {
      init: function () {
        UICtrl.clearEditState();
        const items = ItemCtrl.getItems();
        if (!items.length) {
          UICtrl.hideList();
        } else {
          document.querySelector(UICtrl.getSelectors().itemList).style.display = 'block';
        }
        UICtrl.populateItemsList(items);
        const totalCalories = ItemCtrl.getTotalCalories();
        UICtrl.showTotalCalories(totalCalories);
        loadEventListeners();
      }
    };
  })(ItemCtrl, StorageCtrl, UICtrl);

  App.init();
})();
