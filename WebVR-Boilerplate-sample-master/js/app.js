(function (THREE) {
    'use strict';

    let renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    let scene = new THREE.Scene();
    window.scene = scene;

    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

    let controls = new THREE.VRControls(camera);
    controls.standing = true;

    let effect = new THREE.VREffect(renderer);
    effect.setSize(window.innerWidth, window.innerHeight);

    let hitTargets = [];

    // Add a repeating grid as a skybox.
    let boxSize = 5;
    let loader = new THREE.TextureLoader();
    let skybox = null;

    const onTextureLoaded = (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(boxSize, boxSize);

        let geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
        let material = new THREE.MeshBasicMaterial({
            map: texture,
            color: 0x01BE00,
            side: THREE.BackSide
        });

        skybox = new THREE.Mesh(geometry, material);
        skybox.name = 'skybox';
        skybox.position.y = boxSize/2;
        scene.add(skybox);

        setupStage();
    };

    loader.load('img/box.png', onTextureLoaded);

    // Create a VR manager helper to enter and exit VR mode.
    let params = {
        hideButton: false, // Default: false.
        isUndistorted: false // Default: false.
    };
    let manager = new WebVRManager(renderer, effect, params);

    // Create 3D objects.
    let geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    let material = new THREE.MeshNormalMaterial();
    let cube = new THREE.Mesh(geometry, material);
    cube.name = 'cube';
    cube.position.set(0, controls.userHeight, -1);
    cube.rotation.x = 0.5;
    cube.rotation.y = 0.2;
    cube.rotation.z = 0.1;
    scene.add(cube);
    hitTargets.push(cube);

    let mover = new VRMover(cube);

    // ライトの生成
    let light = new THREE.DirectionalLight(0xffffff);
    light.position.set(10, 10, 10);
    scene.add(light);

    let ambient = new THREE.AmbientLight(0x444444);
    scene.add(ambient);

    /**
     * アニメーションループ
     */
    let lastRender = 0;
    const animate = (timestamp) => {
        let delta = Math.min(timestamp - lastRender, 500);
        lastRender = timestamp;

        controls.update();

        // コントローラの位置、回転をupdate
        controller1.update();
        controller2.update();

        pointer1.update();
        pointer2.update();

        let hit1 = pointer1.raycast(hitTargets);
        let hit2 = pointer2.raycast(hitTargets);

        if (controller1.triggerIsPressed) {
            if (hit1 != null) {
                if (mover.grabber !== controller1) {
                    mover.grab(controller1);
                }
            }
        }
        else {
            if (mover.grabber === controller1) {
                mover.ungrab();
            }
        }

        if (controller2.triggerIsPressed) {
            if (hit2 != null) {
                if (mover.grabber !== controller2) {
                    mover.grab(controller2);
                }
            }
        }
        else {
            if (mover.grabber === controller2) {
                mover.ungrab();
            }
        }

        mover.update();

        // シーンをレンダリング
        manager.render(scene, camera, timestamp);

        vrDisplay.requestAnimationFrame(animate);
    };

    /**
     * リサイズ時のイベントハンドラ
     */
    const onResize = (e) => {
        effect.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize, true);
    window.addEventListener('vrdisplaypresentchange', onResize, true);

    let vrDisplay;
    const setupStage = () => {
        navigator.getVRDisplays().then(function(displays) {
            if (displays.length > 0) {
                vrDisplay = displays[0];

                if (vrDisplay.stageParameters) {
                    setStageDimensions(vrDisplay.stageParameters);
                }

                vrDisplay.requestAnimationFrame(animate);
            }
        });
    };

    /**
     * ステージ情報のセットアップ
     */
    const setStageDimensions = (stage) => {
        // Make the skybox fit the stage.
        let material = skybox.material;
        scene.remove(skybox);

        // Size the skybox according to the size of the actual stage.
        let geometry = new THREE.BoxGeometry(stage.sizeX, boxSize, stage.sizeZ);
        skybox = new THREE.Mesh(geometry, material);
        skybox.name = 'skybox';

        // Place it on the floor.
        skybox.position.y = boxSize/2;
        scene.add(skybox);

        // Place the cube in the middle of the scene, at user height.
        cube.position.set(0, controls.userHeight, 0);
    };

    // コントローラの生成
    let controller1 = new VRController(0);
    controller1.standingMatrix = controls.getStandingMatrix();
    scene.add(controller1);

    let controller2 = new VRController(1);
    controller2.standingMatrix = controls.getStandingMatrix();
    scene.add(controller2);

    // コントローラに使うモデルを読み込み
    let objLoader = new THREE.OBJLoader();
    objLoader.load('models/controller_mock.obj', (obj) => {

        let loader = new THREE.TextureLoader();
        let controller = obj.children[0];
        controller.material.castShadow = true;
        controller.material.receiveShadow = true;
        controller.position.z = 0.14;
        controller.position.y = -0.005;

        controller1.add(controller.clone());
        controller2.add(controller.clone());
    });

    let pointer1 = new VRPointer(controller1, new THREE.Color(0x0000ff), 2);
    let pointer2 = new VRPointer(controller2, new THREE.Color(0xff0000), 2);

    // sceneにlineを追加
    scene.add(pointer1.line);
    scene.add(pointer2.line);

}(THREE))
