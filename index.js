  /*
  * Copyright 2016 Google Inc. All rights reserved.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *   http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */
  "use strict";

  (function () {
    var Marzipano = window.Marzipano;
    var bowser = window.bowser;
    var screenfull = window.screenfull;
    var data = window.APP_DATA;

    // Grab elements from DOM.
    var panoElement = document.querySelector("#pano");
    var sceneNameElement = document.querySelector("#titleBar .sceneName");
    var sceneListElement = document.querySelector("#sceneList");
    var sceneElements = document.querySelectorAll("#sceneList .scene");
    var sceneListToggleElement = document.querySelector("#sceneListToggle");
    var autorotateToggleElement = document.querySelector("#autorotateToggle");
    var fullscreenToggleElement = document.querySelector("#fullscreenToggle");

    // Detect desktop or mobile mode.
    if (window.matchMedia) {
      var setMode = function () {
        if (mql.matches) {
          document.body.classList.remove("desktop");
          document.body.classList.add("mobile");
        } else {
          document.body.classList.remove("mobile");
          document.body.classList.add("desktop");
        }
      };
      var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
      setMode();
      mql.addListener(setMode);
    } else {
      document.body.classList.add("desktop");
    }

    // Detect whether we are on a touch device.
    document.body.classList.add("no-touch");
    window.addEventListener("touchstart", function () {
      document.body.classList.remove("no-touch");
      document.body.classList.add("touch");
    });

    // Use tooltip fallback mode on IE < 11.
    if (bowser.msie && parseFloat(bowser.version) < 11) {
      document.body.classList.add("tooltip-fallback");
    }

    // Viewer options.
    var viewerOpts = {
      controls: {
        mouseViewMode: data.settings.mouseViewMode,
      },
    };

    // Initialize viewer.
    var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

    // Create scenes.
    var scenes = data.scenes.map(function (data) {
      var urlPrefix = "tiles";
      var source = Marzipano.ImageUrlSource.fromString(
        urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
        { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" }
      );
      var geometry = new Marzipano.CubeGeometry(data.levels);

      var limiter = Marzipano.RectilinearView.limit.traditional(
        data.faceSize,
        (100 * Math.PI) / 180,
        (120 * Math.PI) / 180
      );
      var view = new Marzipano.RectilinearView(
        data.initialViewParameters,
        limiter
      );

      var scene = viewer.createScene({
        source: source,
        geometry: geometry,
        view: view,
        pinFirstLevel: true,
      });

      // Create link hotspots.
      data.linkHotspots.forEach(function (hotspot) {
        var element = createLinkHotspotElement(hotspot);
        scene
          .hotspotContainer()
          .createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
      });

      // Create info hotspots.
      data.infoHotspots.forEach(function (hotspot) {
        var element = createInfoHotspotElement(hotspot);
        scene
          .hotspotContainer()
          .createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
      });

      return {
        data: data,
        scene: scene,
        view: view,
      };
    });

    // Set up autorotate, if enabled.
    var autorotate = Marzipano.autorotate({
      yawSpeed: 0.03,
      targetPitch: 0,
      targetFov: Math.PI / 2,
    });
    if (data.settings.autorotateEnabled) {
      autorotateToggleElement.classList.add("enabled");
    }

    // Set handler for autorotate toggle.
    autorotateToggleElement.addEventListener("click", toggleAutorotate);

    // Set up fullscreen mode, if supported.
    if (screenfull.enabled && data.settings.fullscreenButton) {
      document.body.classList.add("fullscreen-enabled");
      fullscreenToggleElement.addEventListener("click", function () {
        screenfull.toggle();
      });
      screenfull.on("change", function () {
        if (screenfull.isFullscreen) {
          fullscreenToggleElement.classList.add("enabled");
        } else {
          fullscreenToggleElement.classList.remove("enabled");
        }
      });
    } else {
      document.body.classList.add("fullscreen-disabled");
    }

    // Set handler for scene list toggle.
    sceneListToggleElement.addEventListener("click", toggleSceneList);

    // Start with the scene list open on desktop.
    if (!document.body.classList.contains("mobile")) {
      showSceneList();
    }

    // Set handler for scene switch.
    scenes.forEach(function (scene) {
      var el = document.querySelector(
        '#sceneList .scene[data-id="' + scene.data.id + '"]'
      );
      el.addEventListener("click", function () {
        switchScene(scene);
        // On mobile, hide scene list after selecting a scene.
        if (document.body.classList.contains("mobile")) {
          hideSceneList();
        }
      });
    });

    // DOM elements for view controls.
    var viewUpElement = document.querySelector("#viewUp");
    var viewDownElement = document.querySelector("#viewDown");
    var viewLeftElement = document.querySelector("#viewLeft");
    var viewRightElement = document.querySelector("#viewRight");
    var viewInElement = document.querySelector("#viewIn");
    var viewOutElement = document.querySelector("#viewOut");
    var btnss = document.getElementById("myBtn2");
    document.querySelector('#viewIn').addEventListener('keydown', function (event) {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        updateView('zoomIn');
      }
    });

    document.querySelector('#viewOut').addEventListener('keydown', function (event) {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        updateView('zoomOut');
      }
    });



    // new function for buttons
    function updateView(action) {
      var view = viewer.view();
      var yaw = view.yaw();
      var pitch = view.pitch();
      var fov = view.fov();

      switch (action) {
        case 'left':
          view.setYaw(yaw - Math.PI / 8);
          break;
        case 'right':
          view.setYaw(yaw + Math.PI / 8);
          break;
        case 'up':
          // Decrease pitch to look upwards
          view.setPitch(pitch - Math.PI / 8);
          break;
        case 'down':
          // Increase pitch to look downwards
          view.setPitch(pitch + Math.PI / 8);
          break;
        case 'zoomIn':
          view.setFov(Math.max(fov - Math.PI / 8, 0.1)); // Limit zoom in
          break;
        case 'zoomOut':
          view.setFov(Math.min(fov + Math.PI / 8, Math.PI / 2)); // Limit zoom out
          break;
      }
    }

    // Assign event listeners for all control buttons
    document.querySelectorAll('.viewControlButton').forEach(function (element) {
      element.addEventListener('click', function () {
        updateView(element.id.replace('view', '').toLowerCase());
      });

      element.addEventListener('keydown', function (event) {
        if (event.code === 'Space') {
          event.preventDefault();
          updateView(element.id.replace('view', '').toLowerCase());
        }
      });
    });
    // Dynamic parameters for controls.
    var velocity = 0.7;
    var friction = 3;

    // Associate view controls with elements.
    var controls = viewer.controls();
    controls.registerMethod(
      "upElement",
      new Marzipano.ElementPressControlMethod(
        viewUpElement,
        "y",
        -velocity,
        friction
      ),
      true
    );
    controls.registerMethod(
      "downElement",
      new Marzipano.ElementPressControlMethod(
        viewDownElement,
        "y",
        velocity,
        friction
      ),
      true
    );
    controls.registerMethod(
      "leftElement",
      new Marzipano.ElementPressControlMethod(
        viewLeftElement,
        "x",
        -velocity,
        friction
      ),
      true
    );
    controls.registerMethod(
      "rightElement",
      new Marzipano.ElementPressControlMethod(
        viewRightElement,
        "x",
        velocity,
        friction
      ),
      true
    );
    controls.registerMethod(
      "inElement",
      new Marzipano.ElementPressControlMethod(
        viewInElement,
        "zoom",
        -velocity,
        friction
      ),
      true
    );
    controls.registerMethod(
      "outElement",
      new Marzipano.ElementPressControlMethod(
        viewOutElement,
        "zoom",
        velocity,
        friction
      ),
      true
    );

    function sanitize(s) {
      return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    function switchScene(scene) {
      stopAutorotate();
      scene.view.setParameters(scene.data.initialViewParameters);
      scene.scene.switchTo();
      startAutorotate();
      updateSceneName(scene);
      updateSceneList(scene);
    }

    function updateSceneName(scene) {
      sceneNameElement.innerHTML = sanitize(data.name);
    }

    function updateSceneList(scene) {
      for (var i = 0; i < sceneElements.length; i++) {
        var el = sceneElements[i];
        if (el.getAttribute("data-id") === scene.data.id) {
          el.classList.add("current");
        } else {
          el.classList.remove("current");
        }
      }
    }

    function showSceneList() {
      sceneListElement.classList.add("enabled");
      sceneListToggleElement.classList.add("enabled");
      sceneListToggleElement.innerHTML = '隱藏場景 Hide Scene';
    }

    function hideSceneList() {
      sceneListElement.classList.remove("enabled");
      sceneListToggleElement.classList.remove("enabled");
      sceneListToggleElement.innerHTML = '顯示場景 Show Scene';
    }

    function toggleSceneList() {
      sceneListElement.classList.toggle("enabled");
      sceneListToggleElement.classList.toggle("enabled");
    }

    function startAutorotate() {
      if (!autorotateToggleElement.classList.contains("enabled")) {
        return;
      }
      viewer.startMovement(autorotate);
      viewer.setIdleMovement(3000, autorotate);
    }

    function stopAutorotate() {
      viewer.stopMovement();
      viewer.setIdleMovement(Infinity);
    }

    function toggleAutorotate() {
      if (autorotateToggleElement.classList.contains("enabled")) {
        autorotateToggleElement.classList.remove("enabled");
        stopAutorotate();
      } else {
        autorotateToggleElement.classList.add("enabled");
        startAutorotate();
      }
    }

    // My work
    function createLinkHotspotElement(hotspot) {
      // Create wrapper element to hold icon and tooltip.
      var wrapper = document.createElement("div");
      wrapper.classList.add("hotspot");
      wrapper.classList.add("link-hotspot");

      // Create image element.
      var icon = document.createElement("img");
      icon.src = "img/link.png";
      icon.classList.add("link-hotspot-icon");
      icon.alt = "To this location 往該位置";
      icon.role = "button";


      // Set rotation transform.
      icon.style.transform = `rotate(${hotspot.rotation}rad)`;

      // Make the image keyboard-focusable using "Tab" key.
      icon.tabIndex = 0;
      // Add event listener for "keydown" event.
      icon.addEventListener("keydown", function (event) {
        // Check if the "Enter" key is pressed (key code 13).
        if (event.keyCode === 13) {
          // Simulate a click on the image.
          icon.click();
        }
      });
      // Set rotation transform.
      var transformProperties = [
        "-ms-transform",
        "-webkit-transform",
        "transform",
      ];
      for (var i = 0; i < transformProperties.length; i++) {
        var property = transformProperties[i];
        icon.style[property] = "rotate(" + hotspot.rotation + "rad)";
      }

      // Add click event handler.
      wrapper.addEventListener("click", function () {
        switchScene(findSceneById(hotspot.target));
      });

      // Prevent touch and scroll events from reaching the parent element.
      // This prevents the view control logic from interfering with the hotspot.
      stopTouchAndScrollEventPropagation(wrapper);

      // Create tooltip element.
      var tooltip = document.createElement("div");
      tooltip.classList.add("hotspot-tooltip");
      tooltip.classList.add("link-hotspot-tooltip");
      tooltip.innerHTML = findSceneDataById(hotspot.target).name;
      tooltip.ariaHidden = "true";

      wrapper.appendChild(icon);
      wrapper.appendChild(tooltip);

      return wrapper;
    }
    //
    function createInfoHotspotElement(hotspot) {
      // Create wrapper element to hold icon and tooltip.
      var wrapper = document.createElement("div");
      wrapper.classList.add("hotspot");
      wrapper.classList.add("info-hotspot");

      // Create hotspot/tooltip header.
      var header = document.createElement("div");
      header.classList.add("info-hotspot-header");

      // Create image element.
      var iconWrapper = document.createElement("div");
      iconWrapper.classList.add("info-hotspot-icon-wrapper");
      var icon = document.createElement("img");
      icon.src = "img/info.png";
      icon.classList.add("info-hotspot-icon");
      iconWrapper.appendChild(icon);

      // Create title element.
      var titleWrapper = document.createElement("div");
      titleWrapper.classList.add("info-hotspot-title-wrapper");
      var title = document.createElement("div");
      title.classList.add("info-hotspot-title");
      title.innerHTML = hotspot.title;
      titleWrapper.appendChild(title);

      // Create close element.
      var closeWrapper = document.createElement("div");
      closeWrapper.classList.add("info-hotspot-close-wrapper");
      var closeIcon = document.createElement("img");
      closeIcon.src = "img/close.png";
      closeIcon.classList.add("info-hotspot-close-icon");
      closeWrapper.appendChild(closeIcon);

      // Construct header element.
      header.appendChild(iconWrapper);
      header.appendChild(titleWrapper);
      header.appendChild(closeWrapper);

      // Create text element.
      var text = document.createElement("div");
      text.classList.add("info-hotspot-text");
      text.innerHTML = hotspot.text;

      // Place header and text into wrapper element.
      wrapper.appendChild(header);
      wrapper.appendChild(text);

      // Create a modal for the hotspot content to appear on mobile mode.
      var modal = document.createElement("div");
      modal.innerHTML = wrapper.innerHTML;
      modal.classList.add("info-hotspot-modal");
      document.body.appendChild(modal);

      var toggle = function () {
        wrapper.classList.toggle("visible");
        modal.classList.toggle("visible");
      };

      // Show content when hotspot is clicked.
      wrapper
        .querySelector(".info-hotspot-header")
        .addEventListener("click", toggle);

      // Hide content when close icon is clicked.
      modal
        .querySelector(".info-hotspot-close-wrapper")
        .addEventListener("click", toggle);

      // Prevent touch and scroll events from reaching the parent element.
      // This prevents the view control logic from interfering with the hotspot.
      stopTouchAndScrollEventPropagation(wrapper);

      return wrapper;
    }

    // Prevent touch and scroll events from reaching the parent element.
    function stopTouchAndScrollEventPropagation(element, eventList) {
      var eventList = [
        "touchstart",
        "touchmove",
        "touchend",
        "touchcancel",
        "wheel",
        "mousewheel",
      ];
      for (var i = 0; i < eventList.length; i++) {
        element.addEventListener(eventList[i], function (event) {
          event.stopPropagation();
        });
      }
    }

    function findSceneById(id) {
      for (var i = 0; i < scenes.length; i++) {
        if (scenes[i].data.id === id) {
          return scenes[i];
        }
      }
      return null;
    }

    function findSceneDataById(id) {
      for (var i = 0; i < data.scenes.length; i++) {
        if (data.scenes[i].id === id) {
          return data.scenes[i];
        }
      }
      return null;
    }

    // Display the initial scene.
    switchScene(scenes[0]);
  })();

  // New popup Code(03/20/24)
  var btnss = document.getElementById("myBtn2");
  btnss.addEventListener("click", displayPopup);
  btnss.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " " || event.code === "Enter" || event.code === "Space") {
      event.preventDefault();
      displayPopup();
    }
  });

  // Add event listener to the close icon to hide the popup
  var closeIcon = document.querySelector(".popup-main .close-icon");
  closeIcon.addEventListener("click", hidePopup);
  closeIcon.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      hidePopup();
    }
  });

  function displayPopup() {
    var popup = document.getElementById("popupmain");

    popup.style.display = "block";
    var popupspan = document.querySelector(".popup-main .close-icon");
    popupspan.tabIndex = 2;
    popupspan.focus();
    popup.addEventListener("keydown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Enter" || event.key === " ") {
        showPopup();
      }
    });

  }

  function hidePopup() {
    var popup = document.getElementById("popupmain");
    popup.style.display = "none";
    var popupspan = document.querySelector(".popup-main .close-icon");
    popupspan.tabIndex = -1;

  }

  // Informational Popup
  document.addEventListener("DOMContentLoaded", function () {
    const showPopupBtn = document.getElementById("infoBtn");
    const closePopupBtn = document.querySelector("#modal-info .close");
    const popup = document.getElementById("modal-info");

    // showPopupBtn.addEventListener("click", () => {
    //   showPopup();
    //   showPopupBtn.addEventListener("keydown", (event) => {
  
    //     // debugger
    //     event.preventDefault();
    //     event.stopPropagation();
    //     const xyz = document.getElementById("xyz");
    // //  debugger;
    //     console.log(event.key);
    //     if (event.key === "Enter" || event.key === " ") {
    //       console.log(xyz, "sda");
    //       hidePopup();
    //     }
    
    //   });
    // });


  

    closePopupBtn.addEventListener("click", () => {
      hidePopup();
    });



    closePopupBtn.addEventListener("keydown", (event) => {
      debugger

      if (event.key === "Enter" || event.key === " " ) {
        hidePopup();
      }
    });

    function showPopup() {
      popup.style.display = "block"; // Show the popup
      closePopupBtn.focus(); // Focus the close button after showing the popup
    }

    function hidePopup() {
      popup.style.display = "none"; // Hide the popup
      showPopupBtn.focus(); // Focus back on the showPopupBtn after closing the popup
    }

    function displayModal(modalId, closeBtnClass) {
      debugger
      var modal = document.getElementById(modalId);
      modal.style.display = "block";
      var closeButton = document.querySelector(`.${closeBtnClass}`);
      closeButton.tabIndex = 2;
      closeButton.focus();
    }

    function hideModal(modalId, closeBtnClass) {
      var modal = document.getElementById(modalId);
      modal.style.display = "none";
      var closeButton = document.querySelector(`.${closeBtnClass}`);
      closeButton.tabIndex = -1;
    }


    // instruction
    var btns = document.getElementById("myBtns");
    btns.addEventListener("click", () => {
      displayModal("myModals", "closes");
    });
    btns.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        displayModal("myModals", "closes");
      }
    });

    var span2 = document.getElementsByClassName("closes")[0];
    span2.addEventListener("click", () => {
      hideModal("myModals", "closes");
    });
    span2.addEventListener("keydown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "Escape"

      ) {
        hideModal("myModals", "closes");
      }
      // if (event.key === "Tab" && !event.shiftKey) {
      //   hideModal("myModals", "closes");
      // }
    });
// info

var btns = document.getElementById("infoBtn");
    btns.addEventListener("click", () => {
      displayModal("modal-info", "close");
    });
    btns.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        displayModal("modal-info", "close");
      }
    });

    var span2 = document.getElementsByClassName("close")[0];
    span2.addEventListener("click", () => {
      hideModal("modal-info", "close");
    });
    span2.addEventListener("keydown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "Escape"

      ) {
        hideModal("modal-info", "close");
      }
      // if (event.key === "Tab" && !event.shiftKey) {
      //   hideModal("myModals", "closes");
      // }
    });

  });

  // audio
  function toggleAudio() {
    if (backgroundAudio.paused) {
      backgroundAudio.play();
      // audioButton.classList.add("rotate-animation");
    } else {
      backgroundAudio.pause();
      // audioButton.classList.remove("rotate-animation");
    }
  }

  const audioButton = document.getElementById("audioButton");
  const icon1 = audioButton.querySelector(".icon-play-pause.active"); // Assuming the play icon is the default
  const icon2 = audioButton.querySelector(".icon-play-pause:not(.active)");

  audioButton.addEventListener("click", function () {
    icon1.classList.toggle("active");
    icon2.classList.toggle("active");

    if (backgroundAudio.paused) {
      audioButton.ariaLabel = "播放音樂 Play music";
    } else {
      audioButton.ariaLabel = "停止音樂 Stop music";
    }
  });



  // New code
  function trapFocus(element) {
    const focusableElements = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), audio[controls], img[role="button"]');
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    function handleKeyDown(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey) { // if shift key pressed for shift + tab combination
          if (document.activeElement === firstFocusableElement) {
            e.preventDefault();
            lastFocusableElement.focus(); // add focus for the last focusable element
          }
        } else { // if tab key is pressed
          if (document.activeElement === lastFocusableElement) {
            e.preventDefault();
            firstFocusableElement.focus(); // add focus for the first focusable element
          }
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown);

    // Set initial focus to the first focusable element
    firstFocusableElement.focus();

    return {
      releaseFocus: function () {
        element.removeEventListener('keydown', handleKeyDown);
      }
    };
  }

  // Open modal function
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'block';
    const focusTrap = trapFocus(modal);

    // Reset focus inside the modal to the first focusable element.
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), audio[controls], img[role="button"]');
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return focusTrap;
  }

  // Close modal function
  function closeModal(modalId, focusTrap) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    focusTrap.releaseFocus();
  }

  // Initialize modals
  function initializeModals() {
    let focusTrapInfo, focusTrapInstructions, focusTrapNewModel;

    document.getElementById('infoBtn').addEventListener('click', function () {
      focusTrapInfo = openModal('modal-info');
    });
    document.getElementById('infoBtn').addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        focusTrapInfo = openModal('modal-info');
      }
    });
    document.querySelector('#modal-info .close').addEventListener('click', function () {
      closeModal('modal-info', focusTrapInfo);
    });

    document.getElementById('myBtns').addEventListener('click', function () {
      focusTrapInstructions = openModal('myModals');
    });

    document.querySelector('#myModals .closes').addEventListener('click', function () {
      closeModal('myModals', focusTrapInstructions);
    });

    document.getElementById('myBtn2').addEventListener('click', function () {
      focusTrapNewModel = openModal('popupmain');
    });

    document.querySelector('.popup-main .close-icon').addEventListener('click', function () {
      closeModal('popupmain', focusTrapNewModel);
    });
  }

  document.addEventListener('DOMContentLoaded', initializeModals);


