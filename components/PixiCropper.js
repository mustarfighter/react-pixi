"use client"
// pages/index.js
import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Assets, Sprite } from 'pixi.js';


const ImageEditor = () => {
    const ref = useRef(null);
    const appRef = useRef(null);
    const imageRef = useRef(null);
    const cropAreaRef = useRef(null);
    const handlesRef = useRef({ tl: null, tr: null, bl: null, br: null });
    let app, image, cropArea, tl, tr, bl, br;
    const [draggingArea, setDraggingArea] = useState(false);
    const [areaStartX, setAreaStartX] = useState(0);
    const [areaStartY, setAreaStartY] = useState(0);
    const draggingData = useRef({dragging: false, data: null});

    useEffect(() => {
        // Initialize PIXI Application
        appRef.current = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0x004c00
        });
        if(ref.current) {
            ref.current.appendChild(appRef.current.view);
        }
        // Initialize crop area and handles
        initializeCropArea();
        initializeHandles();

        // Cleanup
        return () => {
            appRef.current.destroy(true, true);
        };
    }, []);

    const initializeCropArea = () => {
        cropArea = new PIXI.Graphics()
            .beginFill(0xFFFFFF, 0.4)
            .drawRect(0, 0, 400, 200)
            .endFill();
        cropArea.x = 1000;
        cropArea.y = 225;
        cropArea.buttonMode = true;
        cropArea.eventMode = 'dynamic';
        cropArea
            .on('pointerdown', (event) => onDragStart(event, handle))
            // .on('pointerup', onDragEnd)
            // .on('pointerupoutside', onDragEnd)
            .on('pointermove', onDragMove);
        if(appRef.current){
            appRef.current.stage.addChild(cropArea);
        }
        attachAreaInteraction();
    };

    const initializeHandles = () => {
        tl = createHandle(cropArea.x, cropArea.y);
        tr = createHandle(cropArea.x + cropArea.width, cropArea.y);
        bl = createHandle(cropArea.x, cropArea.y + cropArea.height);
        br = createHandle(cropArea.x + cropArea.width, cropArea.y + cropArea.height);
        appRef.current.stage.addChild(tl);
        appRef.current.stage.addChild(tr);
        appRef.current.stage.addChild(bl);
        appRef.current.stage.addChild(br);
    };

    const createHandle = (x, y) => {
        let handle = new PIXI.Graphics()
            .beginFill(0x00FF00)
            .drawCircle(0, 0, 8)
            .endFill();
        handle.x = x;
        handle.y = y;
        handle.eventMode = 'dynamic';
        handle.buttonMode = true;
        handle
            .on('pointerdown', (event) => onDragStart(event, handle))
            .on('pointerup', onDragEnd)
            .on('pointerupoutside', onDragEnd)
            .on('pointermove', onDragMove);
        return handle;
    };

    const resetHandles = () => {
        if (cropArea && tl && tr && bl && br) {
            tl.x = cropArea.x;
            tl.y = cropArea.y;
            tr.x = cropArea.x + cropArea.width;
            tr.y = cropArea.y;
            bl.x = cropArea.x;
            bl.y = cropArea.y + cropArea.height;
            br.x = cropArea.x + cropArea.width;
            br.y = cropArea.y + cropArea.height;
        }
    };

    const attachAreaInteraction = () => {
        cropArea
            .on('pointerdown', (event) => onDragStart(event, handle))
            .on('pointerup', onDragEnd)
            .on('pointerupoutside', onDragEnd)
            .on('pointermove', (event) => onDragMove(event)); // Esemény paraméter átadása
    };

    const onDragStart = (event, handle) => {
        draggingData.current.data = handle;
        draggingData.current.dragging = true;
        draggingData.current.draggingHandle = handle;
        document.addEventListener('mousemove', onDragMove);
    };

    const onDragEnd = () => {
        // Handle drag end logic
        draggingData.current.dragging = false;
        draggingData.current.data = null;
    };

    const onDragMove = (event) => {
        if (!draggingData.current.dragging || !draggingData.current.data) return;
        
        draggingData.current.data = { x: event.clientX, y: event.clientY };
        const globalPosition = { x: event.clientX, y: event.clientY };
        const newPosition = draggingData.current.draggingHandle.parent.toLocal(globalPosition);

        // Korlátozzuk a fogantyúk mozgását a kép határain belül
        const imageBounds = {
            minX: image.x - image.width / 2,
            maxX: image.x + image.width / 2,
            minY: image.y - image.height / 2,
            maxY: image.y + image.height / 2
        };

        // Az új pozíciót a kép határai között korlátozzuk
        newPosition.x = Math.max(imageBounds.minX, Math.min(imageBounds.maxX, newPosition.x));
        newPosition.y = Math.max(imageBounds.minY, Math.min(imageBounds.maxY, newPosition.y));

        const handle = draggingData.current.draggingHandle;
        handle.x = newPosition.x;
        handle.y = newPosition.y;

        // Frissítsd a cropArea méretét és helyzetét a fogantyúk új helyzete alapján
        if (handle === bl || handle === tr) {
            cropArea.x = Math.min(bl.x, tr.x);
            cropArea.y = Math.min(bl.y, tr.y);
            cropArea.width = Math.abs(bl.x - tr.x);
            cropArea.height = Math.abs(bl.y - tr.y);

            br.x = cropArea.x + cropArea.width;
            br.y = cropArea.y + cropArea.height;
            tl.x = cropArea.x;
            tl.y = cropArea.y;
        } else {
            cropArea.x = Math.min(tl.x, br.x);
            cropArea.y = Math.min(tl.y, br.y);
            cropArea.width = Math.abs(tl.x - br.x);
            cropArea.height = Math.abs(tl.y - br.y);

            bl.x = cropArea.x;
            bl.y = cropArea.y + cropArea.height;
            tr.x = cropArea.x + cropArea.width;
            tr.y = cropArea.y;
        }

        resetHandles(); // Frissíti a fogantyúk pozícióját
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            loadImage(file); // Load the image when a file is selected
        }
    };

    const loadImage = async (file) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            // Load the texture using Assets
            const texture = await Assets.load(e.target.result);

            // Ensure the PIXI app is initialized
            if (appRef.current) {
                // Remove the previous image if it exists
                if (image) {
                    appRef.current.stage.removeChild(image);
                }

                // Create a new sprite for the loaded image
                image = new Sprite(texture);

                // Adjust the image size and position
                let originalRatio = image.texture.orig.width / image.texture.orig.height;
                let maxW = appRef.current.screen.width * 0.9;
                let maxH = appRef.current.screen.height * 0.9;
                let targetRatio = maxW / maxH;

                if (originalRatio > targetRatio) {
                    image.width = maxW;
                    image.height = maxW / originalRatio;
                } else {
                    image.height = maxH;
                    image.width = maxH * originalRatio;
                }

                image.x = appRef.current.screen.width / 2;
                image.y = appRef.current.screen.height / 2;
                image.anchor.set(0.5);
                image.eventMode = 'dynamic'
                // Ensure cropArea is initialized before adjusting it
                if (cropArea) {
                    // Adjust the crop area to the new image
                    cropArea.clear()
                        .beginFill(0xFFFFFF, 0.4)
                        .drawRect(0, 0, image.width, image.height)
                        .endFill();
                    cropArea.x = image.x - image.width / 2;
                    cropArea.y = image.y - image.height / 2;
                }

                // Reset the handles to match the new crop area
                resetHandles();

                // Add the new image and updated crop area to the stage
                appRef.current.stage.addChild(image);
                if (cropArea) appRef.current.stage.addChild(cropArea);
                if (tl) appRef.current.stage.addChild(tl);
                if (tr) appRef.current.stage.addChild(tr);
                if (bl) appRef.current.stage.addChild(bl);
                if (br) appRef.current.stage.addChild(br);
            }
        };
        reader.readAsDataURL(file);
    };

    const cropImage = () => {
        // Logic to crop image
        // Calculate the cropping coordinates relative to the original image
        let scaleX = image.scale.x;
        let scaleY = image.scale.y;
        let cropX = (cropArea.x - image.x + (image.width / 2)) / scaleX + image.texture.orig.width / 2 - image.width / (2 * scaleX);
        let cropY = (cropArea.y - image.y + (image.height / 2)) / scaleY + image.texture.orig.height / 2 - image.height / (2 * scaleY);
        let cropWidth = cropArea.width / scaleX;
        let cropHeight = cropArea.height / scaleY;
        let rectangle = new PIXI.Rectangle(cropX, cropY, cropWidth, cropHeight);

        let croppedTexture = new PIXI.Texture(image.texture.baseTexture, rectangle);

        // Create a sprite for the cropped image
        let croppedImage = new PIXI.Sprite(croppedTexture);
        appRef.current.stage.addChild(croppedImage);

        // Extract the base64 data and convert it to a Blob
        appRef.current.renderer.extract.canvas(croppedImage).toBlob((blob) => {
            // Create a Blob URL from the Blob
            let url = URL.createObjectURL(blob);

            // Create a download link
            let downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = 'cropped-image.png';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Clean up the URL object
            URL.revokeObjectURL(url);
        }, 'image/png');

        // Remove the cropped image sprite after extracting the data
        appRef.current.stage.removeChild(croppedImage);
    };

    return (
        <div>
            <div ref={ref} />
            <input 
                type="file" 
                onChange={handleFileUpload} 
                className="file:bg-blue-700 file:text-white file:font-bold file:py-2 file:px-4 file:rounded  file:hover:bg-blue-500 file:focus:outline-none file:focus:shadow-outline"
            />
            <button 
                onClick={cropImage}
                className="absolute bg-green-700 text-white font-bold py-2 px-4 rounded hover:bg-green-500 focus:outline-none focus:shadow-outline"
                style={{ left: '677px' }}
            >
                Crop Image
            </button>
        </div>
    );
};
export default ImageEditor;
