// 在文件顶部声明全局变量
let scene, camera, renderer, currentSofa, controls;
let currentHandle = null; // 声明 currentHandle 变量

function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc); // 保持天空颜色不变
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
    renderer.setSize(window.innerWidth * 2 / 3, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    camera.position.set(0, 10, 20);

    // 添加轨道控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;

    // 添加地面
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xe0e0e0,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);

    // 添加区域光作为主光源
    const rectAreaLight1 = new THREE.RectAreaLight(0xffffff, 20, 30, 30); // 增大光照范围
    rectAreaLight1.position.set(10, 15, 10); // 放置在模型右前方
    rectAreaLight1.lookAt(0, 0, 0); // 让光线朝向模型中心
    rectAreaLight1.penumbra = 0.7; // 边缘虚化
    scene.add(rectAreaLight1);

    const rectAreaLight2 = new THREE.RectAreaLight(0xffffff, 20, 30, 30);
    rectAreaLight2.position.set(-10, 15, 10); // 放置在模型左前方
    rectAreaLight2.lookAt(0, 0, 0);
    rectAreaLight2.penumbra = 0.7; // 边缘虚化
    scene.add(rectAreaLight2);

    const rectAreaLight3 = new THREE.RectAreaLight(0xffffff, 20, 30, 30);
    rectAreaLight3.position.set(-10, 15, -10); // 放置在模型左后方
    rectAreaLight3.lookAt(0, 0, 0);
    rectAreaLight3.penumbra = 0.7; // 边缘虚化
    scene.add(rectAreaLight3);

    const rectAreaLight4 = new THREE.RectAreaLight(0xffffff, 20, 30, 30);
    rectAreaLight4.position.set(10, 15, -10); // 放置在模型右后方
    rectAreaLight4.lookAt(0, 0, 0);
    rectAreaLight4.penumbra = 0.7; // 边缘虚化
    scene.add(rectAreaLight4);

    // 在模型后方添加一个较大的区域光
    const backRectAreaLight = new THREE.RectAreaLight(0xffffff, 100, 50, 50); // 更大的光照范围
    backRectAreaLight.position.set(0, 15, -60); // 放置在模型后方
    backRectAreaLight.lookAt(0, 0, 0);
    backRectAreaLight.penumbra = 0.7; // 更强的边缘虚化
    scene.add(backRectAreaLight);

    // 初始化区域光库（必须调用）
    THREE.RectAreaLightUniformsLib.init();

    // 添加点光源作为辅光源
    const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight1.position.set(-20, 10, 0); // 放置在模型左侧
    pointLight1.decay = 3; // 边缘虚化
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight2.position.set(20, 10, 0); // 放置在模型右侧
    pointLight2.decay = 3; // 边缘虚化
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 0.8, 100);
    pointLight3.position.set(0, 10, -20); // 放置在模型后方
    pointLight3.decay = 3; // 边缘虚化
    scene.add(pointLight3);

    const pointLight4 = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight4.position.set(0, 10, 20); // 放置在模型前方
    pointLight4.decay = 3; // 边缘虚化
    scene.add(pointLight4);

    // 添加物理天光（保持天空颜色不变）
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 0.5); // 强度降低
    scene.add(hemisphereLight);

    // 添加环境光（强度降低）
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3); // 强度降低
    scene.add(ambientLight);
}


// 加载沙发模型
function loadSofa(index) {
    const modelFiles = ['sofa1.fbx', 'sofa2.fbx', 'sofa3.fbx', 'sofa4.fbx', 'sofa5.fbx', 'sofa6.fbx'];
    if (index < 0 || index >= modelFiles.length) {
        console.error('无效的沙发索引:', index);
        return;
    }

    const loader = new THREE.FBXLoader();
    const modelPath = `models/${modelFiles[index]}`;
    console.log('正在加载模型:', modelPath);

    // 显示加载指示器
    document.getElementById('loading-indicator').style.display = 'block';

    loader.load(modelPath, (fbx) => {
        console.log('模型加载成功:', fbx);
        if (currentSofa) scene.remove(currentSofa);
        currentSofa = fbx;
        currentSofa.scale.set(1, 0.7, 1);
        currentSofa.position.set(0, -0.9, 0);

        // 遍历模型的所有子对象，打印名称
        currentSofa.traverse((child) => {
            if (child.isMesh) {
                console.log('当前部件名称:', child.name);
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(currentSofa);
        document.getElementById('loading-indicator').style.display = 'none';
    }, undefined, (error) => {
        console.error('加载模型时发生错误:', error);
        document.getElementById('loading-indicator').style.display = 'none';
    });
}

// 定义拉手模型路径
const handleModels = {
    Golden: 'models/golden-handle.fbx',
    Silver: 'models/silver-handle.fbx'
};

// 选择拉手
function selectHandle(handleType) {
    if (!currentSofa) {
        console.error('当前没有加载的沙发模型');
        return;
    }

    // 移除之前选中的拉手
    if (currentHandle) {
        scene.remove(currentHandle);
    }

    // 加载新的拉手模型
    const loader = new THREE.FBXLoader();
    loader.load(handleModels[handleType], (fbx) => {
        currentHandle = fbx; // 直接赋值，不再声明
        currentHandle.scale.set(1, 0.7, 1);
        currentHandle.position.set(0, -0.9, 0); // 调整位置以匹配沙发
        scene.add(currentHandle);

        console.log(`已加载拉手模型: ${handleType}`);
    });

    // 更新拉手选项的选中状态
    document.querySelectorAll('.handle-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`.handle-option[onclick="selectHandle('${handleType}')"]`).classList.add('selected');
}

// 初始化拉手选择
function initHandleSelector() {
    // 默认选择金色拉手
    selectHandle('Golden');
}

// 初始化
document.addEventListener('DOMContentLoaded', function () {
    initThreeJS();
    animate();
    showPage('sofa-selection');
    initHandleSelector(); // 初始化拉手选择
});


// 渲染循环
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // 更新轨道控制器
    renderer.render(scene, camera);
}

// 切换页面
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    const activePage = document.getElementById(pageId);
    activePage.classList.add('active');
    activePage.style.display = 'flex';
}

// 初始化
document.addEventListener('DOMContentLoaded', function () {
    initThreeJS();
    animate();
    showPage('sofa-selection');
});

// 沙发选择事件
document.querySelectorAll('.sofa-item').forEach(item => {
    item.addEventListener('click', function () {
        const index = item.getAttribute('data-index');
        loadSofa(index);
        document.getElementById('sofa-name').textContent = item.querySelector('p').textContent;
        showPage('color-selection');
    });
});

// 返回按钮事件
document.getElementById('back-button').addEventListener('click', function () {
    showPage('sofa-selection');
});

// 动态添加颜色选择项
const mainColors248 = ['textures/248-01.jpg', 'textures/248-02.jpg', 'textures/248-03.jpg', 'textures/248-04.jpg', 'textures/248-05.jpg', 
            'textures/248-06.jpg', 'textures/248-07.jpg', 'textures/248-08.jpg', 'textures/248-09.jpg', 'textures/248-10.jpg',
            'textures/248-11.jpg', 'textures/248-12.jpg', 'textures/248-13.jpg'];
const mainColorsS600 = ['textures/S600-01.jpg', 'textures/S600-02.jpg', 'textures/S600-03.jpg', 'textures/S600-04.jpg', 'textures/S600-05.jpg',
            'textures/S600-06.jpg', 'textures/S600-07.jpg', 'textures/S600-08.jpg', 'textures/S600-16.jpg'];
const mainColorsW00 = ['textures/W001.jpg', 'textures/W002.jpg', 'textures/W003.jpg', 'textures/W004.jpg', 'textures/W007.jpg',
            'textures/W010.jpg', 'textures/W011.jpg', 'textures/W012.jpg', 'textures/W013.jpg', 'textures/W014.jpg'];
const accentColorsP248 = ['textures/P248-01.jpg', 'textures/P248-02.jpg', 'textures/P248-03.jpg', 'textures/P248-04.jpg', 'textures/P248-05.jpg',
            'textures/P248-06.jpg', 'textures/P248-07.jpg', 'textures/P248-08.jpg', 'textures/P248-09.jpg', 'textures/P248-10.jpg', 'textures/P248-11.jpg',
            'textures/P248-12.jpg', 'textures/P248-13.jpg', 'textures/547-79.jpg', 'textures/547-26.jpg', 'textures/P248-23.jpg', 'textures/P248-24.jpg',
            'textures/P248-26.jpg', 'textures/P248-27.jpg', 'textures/P248-28.jpg', 'textures/P248-29.jpg', 'textures/P248-30.jpg',
            'textures/P248-31.jpg'];
const accentColorsPS600 = ['textures/PS600-01.jpg', 'textures/PS600-02.jpg', 'textures/PS600-03.jpg', 'textures/PS600-04.jpg', 'textures/PS600-05.jpg',
            'textures/PS600-06.jpg', 'textures/PS600-07.jpg', 'textures/PS600-08.jpg', 'textures/PS600-16.jpg', 'textures/PS600-19.jpg', 'textures/PS600-10.jpg', 
            'textures/PS600-11.jpg', 'textures/PS600-14.jpg', 'textures/PS600-17.jpg', 'textures/PS600-18.jpg'];
const accentColorsPW00 = ['textures/PW001.jpg',  'textures/PW004.jpg',  'textures/PW010.jpg','textures/PW011.jpg', 'textures/PW012.jpg', 'textures/PW008.jpg', 
            'textures/PW009.jpg'];
const accentColorsNapa = ['textures/24.jpg','textures/41.jpg','textures/44.jpg','textures/45.jpg','textures/46.jpg','textures/47.jpg','textures/49.jpg','textures/50.jpg',
            'textures/51.jpg','textures/52.jpg'];

// 动态添加颜色选择项
function initColorPickers() {
    addColorOptions('main-colors-248', mainColors248, true); // 主色系列
    addColorOptions('main-colors-s600', mainColorsS600, true);
    addColorOptions('main-colors-w00', mainColorsW00, true);
    addColorOptions('accent-colors-p248', accentColorsP248, false); // 配色系列
    addColorOptions('accent-colors-ps600', accentColorsPS600, false);
    addColorOptions('accent-colors-pw00', accentColorsPW00, false);
    addColorOptions('accent-colors-napa', accentColorsNapa, false);
}

function addColorOptions(containerId, colorPaths, isMain) {
    const container = document.getElementById(containerId);
    colorPaths.forEach(colorPath => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundImage = `url(${colorPath})`;
        
        // 根据是否为主色设置点击事件
        if (isMain) {
            colorOption.onclick = () => applyTexture(colorPath, 'main');
        } else {
            colorOption.onclick = () => applyTexture(colorPath, currentAccent);
        }

        const textureName = document.createElement('div');
        textureName.className = 'texture-name';
        textureName.textContent = colorPath.split('/').pop().split('.')[0];
        colorOption.appendChild(textureName);

        container.appendChild(colorOption);
    });
}

let currentAccent = 'accent'; // 默认选中 accent

// 选择 accent 或 accent1
function selectAccent(accentType) {
    currentAccent = accentType;
    // 更新按钮样式
    document.querySelectorAll('.accent-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`.accent-button[onclick="selectAccent('${accentType}')"]`).classList.add('active');
}

// 应用贴图（修改后的函数）
function applyTexture(texturePath, target) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(texturePath, (texture) => {
        currentSofa.traverse((child) => {
            if (child.isMesh) {
                // 跳过不需要修改的部件
                if (child.name === 'armrest' || child.name === 'armrest1' || child.name === 'back') {
                    return;
                }

                // 确保每个部件使用独立的材质
                if (!child.userData.originalMaterial) {
                    child.userData.originalMaterial = child.material.clone();
                }

                // 仅替换目标部件的材质
                if (child.name === target) {
                    const newMaterial = child.userData.originalMaterial.clone();
                    newMaterial.map = texture;
                    newMaterial.needsUpdate = true;
                    child.material = newMaterial;
                }
            }
        });
    });

    // 移除之前选中的颜色选项的边框样式
    document.querySelectorAll('.color-option.selected').forEach(option => {
        option.classList.remove('selected');
    });

    // 为当前选中的颜色选项添加边框样式
    const selectedOption = document.querySelector(`.color-option[style*="${texturePath}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}


// 切换系列的展开和折叠
function toggleSeries(seriesId) {
    const series = document.getElementById(seriesId);
    const header = document.querySelector(`h4[onclick="toggleSeries('${seriesId}')`);
    if (series.style.display === 'none') {
        series.style.display = 'flex';
        header.textContent = header.textContent.replace('▼', '▲');
    } else {
        series.style.display = 'none';
        header.textContent = header.textContent.replace('▲', '▼');
    }
}

// 初始化颜色选择
initColorPickers();