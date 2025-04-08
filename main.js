// 在文件顶部声明全局变量
let scene, camera, renderer, currentSofa, controls;
let currentHandle = null;
let currentSofaIndex = 0;
let dracoLoader;
let loadingIndicator, progressBar, progressText;
let colorPickersInitialized = false; // 全局变量标记是否已初始化

function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('canvas'),
        antialias: true 
    });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.NoToneMapping; // 禁用色调映射
    renderer.setSize(window.innerWidth * 2 / 3, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    camera.position.set(0, 15, 25);

    // 初始化 Draco 加载器
    dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/libs/draco/gltf/");
    
    // 配置 GLTF 加载器
    const gltfLoader = new THREE.GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // 响应式调整
    function onWindowResize() {
        const isMobile = window.innerWidth <= 768;
        
        // 更新相机
        if (isMobile) {
            // 移动端保持16:9比例
            camera.aspect = window.innerWidth / 260;
        } else {
            camera.aspect = (window.innerWidth * 2 / 3) / window.innerHeight;
        }
        camera.updateProjectionMatrix();
        
        // 更新渲染器
        if (isMobile) {
            renderer.setSize(window.innerWidth, 260); // 与CSS高度一致
        } else {
            renderer.setSize(window.innerWidth * 2 / 3, window.innerHeight);
        }
    }
    
    // 初始调用
    onWindowResize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', onWindowResize);

    // 添加轨道控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.minDistance = 8;    // 增加最小缩放距离
    controls.maxDistance = 60;   // 增加最大缩放距离
    controls.maxPolarAngle = Math.PI / 1.8; // 允许更大的俯视角度

    // 移动端特定设置
    if ('ontouchstart' in window) {
    controls.enablePan = false; // 禁用平移
    controls.maxPolarAngle = Math.PI / 2; // 限制垂直旋转角度
    controls.minDistance = 10; // 最小缩放距离
    controls.maxDistance = 50; // 最大缩放距离
    }

    // 添加地面
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.5,      // 更光滑（原为0.8）
        metalness: 0.1,      // 减少金属感（原为0.2）
        emissive: 0x222222   // 轻微自发光，避免纯白过曝
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true; // 地面接收阴影
    scene.add(ground);

    // ============== 灯光设置 ==============

    // 1. 斜上方的聚光灯（强度 60%），不显示阴影
    const spotLight1 = new THREE.SpotLight(0xffffff, 0.8); // 强度为 60%
    spotLight1.position.set(10, 20, 10); // 放置在模型斜上方
    spotLight1.angle = Math.PI / 4; // 扩大聚光灯角度（原为 Math.PI / 4）
    spotLight1.penumbra = 3; // 进一步增加边缘虚化（原为 1）
    spotLight1.decay = 2; // 衰减
    spotLight1.distance = 50; // 光照距离
    spotLight1.castShadow = false; // 不启用阴影
    scene.add(spotLight1);

    // 2. 正前方的四方聚光灯（强度 70%），不显示阴影
    const spotLight2 = new THREE.SpotLight(0xffffff, 3); // 强度为 70%
    spotLight2.position.set(0, 10, 20); // 放置在模型正前方
    spotLight2.angle = Math.PI / 1; // 扩大聚光灯角度（原为 Math.PI / 6）
    spotLight2.penumbra = 1.5; // 进一步增加边缘虚化（原为 1）
    spotLight2.decay = 2; // 衰减
    spotLight2.distance = 50; // 光照距离
    spotLight2.castShadow = false; // 不启用阴影
    scene.add(spotLight2);

    // 3. 正后方的四方聚光灯（强度 70%），不显示阴影
    const spotLight3 = new THREE.SpotLight(0xffffff, 2.3);
    spotLight3.position.set(0, 10, -20); // 放置在模型正后方
    spotLight3.angle = Math.PI / 3.5; // 扩大聚光灯角度（原为 Math.PI / 6）
    spotLight3.penumbra = 1.5; // 进一步增加边缘虚化（原为 1）
    spotLight3.decay = 2; // 衰减
    spotLight3.distance = 50; // 光照距离
    spotLight3.castShadow = false; // 不启用阴影
    scene.add(spotLight3);

    // 4. 左侧的四方聚光灯（强度 70%），不显示阴影
    const spotLight4 = new THREE.SpotLight(0xffffff, 2.6); // 强度为 70%
    spotLight4.position.set(-20, 10, 0); // 放置在模型左侧
    spotLight4.angle = Math.PI / 1; // 扩大聚光灯角度（原为 Math.PI / 6）
    spotLight4.penumbra = 1.5; // 进一步增加边缘虚化（原为 1）
    spotLight4.decay = 2; // 衰减
    spotLight4.distance = 50; // 光照距离
    spotLight4.castShadow = false; // 不启用阴影
    scene.add(spotLight4);

    // 5. 右侧的四方聚光灯（强度 70%），不显示阴影
    const spotLight5 = new THREE.SpotLight(0xffffff, 2.6); // 强度为 70%
    spotLight5.position.set(20, 10, 0); // 放置在模型右侧
    spotLight5.angle = Math.PI / 1; // 扩大聚光灯角度（原为 Math.PI / 6）
    spotLight5.penumbra = 1.5; // 进一步增加边缘虚化（原为 1）
    spotLight5.decay = 2; // 衰减
    spotLight5.distance = 50; // 光照距离
    spotLight5.castShadow = false; // 不启用阴影
    scene.add(spotLight5);

    // 6. 四方聚光灯上方的区域光（强度 30%），不显示阴影
    const rectAreaLight = new THREE.RectAreaLight(0xffffff, 0.2, 20, 20); // 强度为 30%，宽度和高度为 20
    rectAreaLight.position.set(0, 15, 20); // 放置在四方聚光灯上方
    rectAreaLight.lookAt(0, 0, 0); // 让光线朝向模型中心
    rectAreaLight.castShadow = false; // 不启用阴影
    scene.add(rectAreaLight);

}

// 在main.js中修改loadSofa函数
function loadSofa(index) {
    const modelFiles = ['sofa1.gltf', 'sofa2.gltf', 'sofa3.gltf', 'sofa4.gltf', 'sofa5.gltf'];
    if (index < 0 || index >= modelFiles.length) {
        console.error('无效的沙发索引:', index);
        return;
    }

    const loader = new THREE.GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    const modelPath = `models/${modelFiles[index]}`;

    // 显示加载指示器
    loadingIndicator.style.display = 'flex';
    
    // 移动设备特定提示
    if (window.innerWidth <= 768) {
        progressText.textContent = '加载中，请稍候...';
    } else {
        progressText.textContent = '0%';
    }

    // 添加模拟进度递增（作为保底）
    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
        simulatedProgress += 1;
        if (simulatedProgress < 95) { // 不超过95%，留空间给真实进度
            progressBar.style.width = `${simulatedProgress}%`;
            progressText.textContent = `${simulatedProgress}%`;
        }
    }, 100);

    // 添加10秒超时处理
    const timeout = setTimeout(() => {
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressText.textContent = '100%';
        loadingIndicator.style.display = 'none';
        console.error('加载超时');
    }, 10000);

    loader.load(
        modelPath,
        (gltf) => {
            clearInterval(progressInterval);
            clearTimeout(timeout);
            
            console.log('模型加载成功:', gltf);
            if (currentSofa) scene.remove(currentSofa);
            
            currentSofa = gltf.scene;
            currentSofa.scale.set(100, 100, 100);
            currentSofa.position.set(0, -0.9, 0);

            currentSofa.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    if (!child.userData.originalMaterial) {
                        const original = child.material.clone();
                        original.roughness = 1;
                        original.metalness = 0;
                        child.userData.originalMaterial = original;
                    }
                }
            });

            scene.add(currentSofa);
        
            // 新增：重置颜色选择状态
            resetColorSelection();
            
            // 确保进度显示100%后再隐藏
            progressBar.style.width = '100%';
            progressText.textContent = '100%';
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 300);

            if (currentHandle) scene.remove(currentHandle);
            currentHandle = null;
            initHandleSelector();
        },
        (xhr) => {
            // 清除模拟进度
            clearInterval(progressInterval);
            
            let percent;
            if (xhr.total === 0) {
                // 如果无法获取总大小，使用加载字节数作为进度指示
                percent = Math.min(95, Math.floor(xhr.loaded / 3000000 * 100)); // 假设文件大约3MB
            } else {
                percent = Math.floor(xhr.loaded / xhr.total * 100);
            }
            
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `${percent}%`;
            
            if (percent > 50) {
                progressText.style.color = '#333';
            } else {
                progressText.style.color = '#fff';
            }
        },
        (error) => {
            clearInterval(progressInterval);
            clearTimeout(timeout);
            console.error('加载模型时发生错误:', error);
            progressText.textContent = '加载失败';
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
            }, 1000);
        }
    );
}

// 定义每个沙发的拉手位置和旋转
const sofaHandleConfig = {
    0: { // Sofa 1
        Golden: { position: { x: 0, y: -0.17, z: 2.18 }, rotation: { x: THREE.MathUtils.degToRad(-10.3), y: 0, z: 0 } },
        Silver: { position: { x: 0, y: -0.17, z: 2.18 }, rotation: { x: THREE.MathUtils.degToRad(-10.3), y: 0, z: 0 } }
    },
    1: { // Sofa 2
        Golden: { 
            position: { x: 0, y: -0.5, z: 1.9 }, // 
            rotation: { x: THREE.MathUtils.degToRad(-8), y: 0, z: 0 } // x轴-11度
        },
        Silver: { 
            position: { x: 0, y: -0.5, z: 1.9 },
            rotation: { x: THREE.MathUtils.degToRad(-8), y: 0, z: 0 }
        }
    },
    2: { // Sofa 3
        Golden: { 
            position: { x: 0, y: -1.68, z: 1.7 }, // 
            rotation: { x: THREE.MathUtils.degToRad(-8), y: 0, z: 0 }
        },
        Silver: { 
            position: { x: 0, y: -1.68, z: 1.7 },
            rotation: { x: THREE.MathUtils.degToRad(-8), y: 0, z: 0 }
        }
    },
    3: { // Sofa 4
        Golden: { 
            position: { x: 0, y: -0.5, z: 1.9 }, // 
            rotation: { x: THREE.MathUtils.degToRad(-8), y: 0, z: 0 } // x轴-5.6度
        },
        Silver: { 
            position: { x: 0, y: -0.5, z: 1.9 },
            rotation: { x: THREE.MathUtils.degToRad(-8), y: 0, z: 0 }
        }
    },
    4: { // Sofa 5
        Golden: { position: { x: 0, y: -0.17, z: 2.18 }, rotation: { x: THREE.MathUtils.degToRad(-10.3), y: 0, z: 0 } },
        Silver: { position: { x: 0, y: -0.17, z: 2.18 }, rotation: { x: THREE.MathUtils.degToRad(-10.3), y: 0, z: 0 } }
    }
};

function initHandleSelector() {
// 在DOMContentLoaded中添加
document.querySelectorAll('.handle-option').forEach(opt => {
    opt.addEventListener('click', function() {
        const handleType = this.dataset.handle;
        selectHandle(handleType);
    });
});
}

// 更新拉手模型路径
const handleModels = {
    Golden: 'models/golden-handle.gltf',
    Silver: 'models/silver-handle.gltf'
};

// 修改后的selectHandle函数
function selectHandle(handleType) {
    if (!currentSofa) {
        console.error('请先加载沙发模型！');
        return;
    }

    // 移除旧拉手
    if (currentHandle) {
        scene.remove(currentHandle);
        currentHandle = null; // 确保完全移除
    }

    const loader = new THREE.GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    
    loader.load(handleModels[handleType], (gltf) => {
        // 再次检查是否已移除旧拉手
        if (currentHandle) {
            scene.remove(currentHandle);
        }
        
        currentHandle = gltf.scene;
        
        // 获取当前沙发的拉手配置
        const config = sofaHandleConfig[currentSofaIndex][handleType];
        
        // 应用位置和旋转
        currentHandle.position.set(
            config.position.x,
            config.position.y,
            config.position.z
        );
        currentHandle.rotation.set(
            config.rotation.x,
            config.rotation.y,
            config.rotation.z
        );

        console.log(`Applying handle position: x=${config.position.x}, y=${config.position.y}, z=${config.position.z}`);
        console.log(`Applying handle rotation: x=${config.rotation.x}, y=${config.rotation.y}, z=${config.rotation.z}`);
        
        // 统一缩放比例
        currentHandle.scale.set(103.5, 103.5, 103.5);
        
        // 将拉手添加到场景中
        scene.add(currentHandle);

        // 更新选中状态
        document.querySelectorAll('.handle-option').forEach(opt => 
            opt.classList.remove('selected'));
        document.querySelector(`.handle-option[data-handle="${handleType}"]`)
            .classList.add('selected');
    }, undefined, (error) => {
        console.error('加载拉手模型时出错:', error);
    });
}

// 然后在DOM加载完成后初始化它们
document.addEventListener('DOMContentLoaded', function() {
    loadingIndicator = document.getElementById('loading-indicator');
    progressBar = document.getElementById('progress-bar');
    progressText = document.getElementById('progress-text');
    initThreeJS();
    animate();
    showPage('sofa-selection');
    
    // 初始化拉手选择器
    document.querySelectorAll('.handle-option').forEach(opt => {
        opt.addEventListener('click', function() {
            const handleType = this.dataset.handle;
            selectHandle(handleType);
        });
    });
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
    
    // 移动端特殊处理
    if (window.innerWidth <= 768) {
        activePage.style.display = 'flex';
        activePage.style.flexDirection = 'column';
        activePage.style.overflowY = 'auto';
    } else {
        activePage.style.display = 'flex';
    }
    
    // 如果是颜色选择页面且是移动设备，滚动到顶部
    if (pageId === 'color-selection' && window.innerWidth <= 768) {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
    }
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
        currentSofaIndex = index; // 更新当前沙发索引
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
const mainColors248 = ['textures/248-01.webp', 'textures/248-02.webp', 'textures/248-03.webp', 'textures/248-04.webp', 'textures/248-05.webp', 
    'textures/248-06.webp', 'textures/248-07.webp', 'textures/248-08.webp', 'textures/248-09.webp', 'textures/248-10.webp',
    'textures/248-11.webp', 'textures/248-12.webp', 'textures/248-13.webp'];
const mainColorsS600 = ['textures/S600-01.webp', 'textures/S600-02.webp', 'textures/S600-03.webp', 'textures/S600-04.webp', 'textures/S600-05.webp',
    'textures/S600-06.webp', 'textures/S600-07.webp', 'textures/S600-08.webp', 'textures/S600-16.webp'];
const mainColorsW00 = ['textures/W001.webp', 'textures/W002.webp', 'textures/W003.webp', 'textures/W004.webp', 'textures/W007.webp',
    'textures/W010.webp', 'textures/W011.webp', 'textures/W012.webp', 'textures/W013.webp', 'textures/W014.webp'];
const accentColorsP248 = ['textures/P248-01.webp', 'textures/P248-02.webp', 'textures/P248-03.webp', 'textures/P248-04.webp', 'textures/P248-05.webp',
    'textures/P248-06.webp', 'textures/P248-07.webp', 'textures/P248-08.webp', 'textures/P248-09.webp', 'textures/P248-10.webp', 'textures/P248-11.webp',
    'textures/P248-12.webp', 'textures/P248-13.webp', 'textures/547-79.webp', 'textures/547-26.webp', 'textures/P248-23.webp', 'textures/P248-24.webp',
    'textures/P248-26.webp', 'textures/P248-27.webp', 'textures/P248-28.webp', 'textures/P248-29.webp', 'textures/P248-30.webp',
    'textures/P248-31.webp'];
const accentColorsPS600 = ['textures/PS600-01.webp', 'textures/PS600-02.webp', 'textures/PS600-03.webp', 'textures/PS600-04.webp', 'textures/PS600-05.webp',
    'textures/PS600-06.webp', 'textures/PS600-07.webp', 'textures/PS600-08.webp', 'textures/PS600-16.webp', 'textures/PS600-19.webp', 'textures/PS600-10.webp', 
    'textures/PS600-11.webp', 'textures/PS600-14.webp', 'textures/PS600-17.webp', 'textures/PS600-18.webp'];
const accentColorsPW00 = ['textures/PW001.webp',  'textures/PW004.webp',  'textures/PW010.webp','textures/PW011.webp', 'textures/PW012.webp', 'textures/PW008.webp', 
    'textures/PW009.webp'];
const accentColorsNapa = ['textures/24.webp','textures/41.webp','textures/44.webp','textures/45.webp','textures/46.webp','textures/47.webp','textures/49.webp','textures/50.webp',
    'textures/51.webp','textures/52.webp'];

// 动态添加颜色选择项
function initColorPickers() {
    if (colorPickersInitialized) return; // 如果已初始化则直接返回
    colorPickersInitialized = true;
    
    // 清空所有容器
    document.querySelectorAll('.color-scroll-container').forEach(container => {
        container.innerHTML = '';
    });
    
    addColorOptions('main-colors-248', mainColors248, true);
    addColorOptions('main-colors-s600', mainColorsS600, true);
    addColorOptions('main-colors-w00', mainColorsW00, true);
    addColorOptions('accent-colors-p248', accentColorsP248, false);
    addColorOptions('accent-colors-ps600', accentColorsPS600, false);
    addColorOptions('accent-colors-pw00', accentColorsPW00, false);
    addColorOptions('accent-colors-napa', accentColorsNapa, false);
}

function addColorOptions(containerId, colorPaths, isMain) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // 清空容器
    container.innerHTML = '';
    
    colorPaths.forEach(colorPath => {
        // 检查是否已存在相同路径的选项
        const existing = container.querySelector(`[style*="${colorPath}"]`);
        if (existing) return;
        
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        const webpPath = colorPath.replace('.jpg', '.webp');
        colorOption.style.backgroundImage = `url(${webpPath})`;
        
        // 根据是否为主色设置点击事件
        if (isMain) {
            colorOption.onclick = () => applyTexture(webpPath, 'main');
        } else {
            colorOption.onclick = () => applyTexture(webpPath, currentAccent);
        }

        const textureName = document.createElement('div');
        textureName.className = 'texture-name';
        textureName.textContent = webpPath.split('/').pop().split('.')[0];
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

function applyTexture(texturePath, target) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        texturePath,
        (texture) => {
            // 设置纹理颜色空间为sRGB
            texture.encoding = THREE.sRGBEncoding;
            
            currentSofa.traverse((child) => {
                if (child.isMesh) {
                    // 需要保持原样的部件列表（拉手、扶手等）
                    const fixedParts = ['handle', 'armrest', 'wheel'];
                    const isFixedPart = fixedParts.some(part => 
                        child.name.toLowerCase().includes(part.toLowerCase()));
                    
                    // 如果是要保持原样的部件，则跳过
                    if (isFixedPart) return;

                    if (target === 'main' && 
                        !child.name.includes('accent') && 
                        !isFixedPart) {
                        const newMaterial = child.userData.originalMaterial.clone();
                        newMaterial.map = texture;
                        newMaterial.map.encoding = THREE.sRGBEncoding; // 确保纹理使用sRGB
                        newMaterial.needsUpdate = true;
                        
                        // 重置可能影响颜色的属性
                        newMaterial.roughness = 1;
                        newMaterial.metalness = 0;
                        child.material = newMaterial;
                    }

                    // 主色部分（排除所有accent和fixed parts）
                    if (target === 'main' && 
                        !child.name.includes('accent') && 
                        !isFixedPart) {
                        const newMaterial = child.userData.originalMaterial.clone();
                        newMaterial.map = texture;
                        newMaterial.needsUpdate = true;
                        child.material = newMaterial;
                    } 
                    // accent部分（严格匹配，排除accent1和fixed parts）
                    else if (target === 'accent' && 
                             child.name.includes('accent') && 
                             !child.name.includes('accent1') && 
                             !isFixedPart) {
                        const newMaterial = child.userData.originalMaterial.clone();
                        newMaterial.map = texture;
                        newMaterial.needsUpdate = true;
                        child.material = newMaterial;
                    } 
                    // accent1部分（严格匹配，排除fixed parts）
                    else if (target === 'accent1' && 
                             child.name.includes('accent1') && 
                             !isFixedPart) {
                        const newMaterial = child.userData.originalMaterial.clone();
                        newMaterial.map = texture;
                        newMaterial.needs更新 = true;
                        child.material = newMaterial;
                    }
                }
            });
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        },
        (xhr) => {
            let percent;
            if (xhr.total === 0) {
                percent = Math.min(95, Math.floor(xhr.loaded / 500000 * 100)); // 假设纹理大约500KB
            } else {
                percent = Math.floor(xhr.loaded / xhr.total * 100);
            }
            
            progressBar.style.width = `${percent}%`;
            progressBar.setAttribute('data-progress', `${percent}%`);
            progressText.textContent = `${percent}%`;
            
            // 根据百分比调整文本颜色
            if (percent > 50) {
                progressText.style.color = '#333';
            } else {
                progressText.style.color = '#fff';
            }
        },
        (error) => {
            console.error('加载纹理时发生错误:', error);
            loadingIndicator.style.display = 'none';
            progressText.textContent = '加载失败';
        }
    );

    // 更新颜色显示（保留原有逻辑）
    const colorName = texturePath.split('/').pop().split('.')[0];
    if (target === 'main') {
        document.getElementById('current-main-color').style.backgroundImage = `url(${texturePath})`;
        document.getElementById('current-main-color-name').textContent = colorName;
    } else if (target === 'accent') {
        document.getElementById('current-accent-color').style.backgroundImage = `url(${texturePath})`;
        document.getElementById('current-accent-color-name').textContent = colorName;
    } else if (target === 'accent1') {
        document.getElementById('current-accent1-color').style.backgroundImage = `url(${texturePath})`;
        document.getElementById('current-accent1-color-name').textContent = colorName;
    }

    // 更新选中状态（保留原有逻辑）
    document.querySelectorAll('.color-option.selected').forEach(option => {
        option.classList.remove('selected');
    });
    const selectedOptions = document.querySelectorAll(`.color-option[style*="${texturePath}"]`);
    selectedOptions.forEach(option => {
        option.classList.add('selected');
    });
    
    // 当前显示区域
    if (target === 'main') {
        document.getElementById('current-main-color').classList.add('selected');
    } else if (target === 'accent') {
        document.getElementById('current-accent-color').classList.add('selected');
    } else if (target === 'accent1') {
        document.getElementById('current-accent1-color').classList.add('selected');
    }
}

// 新增：重置颜色选择状态函数
function resetColorSelection() {
    // 清除颜色预览
    document.getElementById('current-main-color').style.backgroundImage = '';
    document.getElementById('current-accent-color').style.backgroundImage = '';
    document.getElementById('current-accent1-color').style.backgroundImage = '';
    
    // 重置文字描述
    document.getElementById('current-main-color-name').textContent = '主色';
    document.getElementById('current-accent-color-name').textContent = '配色';
    document.getElementById('current-accent1-color-name').textContent = '配色1';

    // 移除所有选中状态
    document.querySelectorAll('.color-option.selected').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 重置accent按钮状态
    document.querySelectorAll('.accent-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.accent-button[onclick="selectAccent(\'accent\')"]').classList.add('active');
    currentAccent = 'accent'; // 重置当前选中类型
}

// 切换系列的展开和折叠
function toggleSeries(seriesId) {
    const series = document.getElementById(seriesId);
    const header = document.querySelector(`h4[onclick="toggleSeries('${seriesId}')"]`);
    
    if (!series || !header) {
        console.error('找不到元素:', seriesId);
        return;
    }

    if (series.style.display === 'none' || !series.style.display) {
        series.style.display = 'flex';
        header.classList.add('expanded');
    } else {
        series.style.display = 'none';
        header.classList.remove('expanded');
    }
}
// 初始化颜色选择
initColorPickers();