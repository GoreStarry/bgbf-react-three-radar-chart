import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import * as THREE from "three";
import PropTypes from "prop-types";
import { Canvas, useThree, extend } from "@react-three/fiber";
// import * as THREE from "three";
import canvasToImage from "canvas-to-image";
import _ from "lodash";
import cx from "classnames";
import { a, useSpring } from "react-spring/three";
// import { Effects } from "@react-three/drei";
// import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
// import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";

import useStore from "../store/useStore.js";

import BgClickOut from "../components/BgClickOut";
import AbilityPlate from "../components/AbilityPlate";
import BgRadarChart from "../components/BgRadarChart";
import Camera from "../components/Camera";

import sty from "./ThreeRadarChart.module.scss";

// extend({ ShaderPass });

const ThreeRadarChart = ({
  className,
  centerPoint = [0, 0, 0],
  lengthRadius = 1,
  maxValue = 5,
  data = [
    { name: "我齁", value: 5 },
    { name: "美術", value: 3 },
    { name: "測試試", value: 0.5 },
    { name: "創意", value: 3 },
    { name: "耐玩", value: 5 },
    { name: "策略", value: 1 },
  ],
  control = true,
  isTriggerSaveImage,
  onCompleteSaveImage,
  nameSavedImage,
  children,
  canvasBgColor = "transparent",
  fontColor = "white",
  textHeight = 0.22,
  textStrokeWidth = 0,
  textStrokeColor = "white",
  outlineColor = "#aac3e0",
  outOutlineStrokeWidth = 1.2,
  centerOutLineColor,
  abilityPlateBgColor = "#313b47",
  abilityPlateColor = "#2E5E79",
  offsetY = 0.15,
  // focusPointIndex = false,
  // isAutoDetectFocusPointIndex = true,
  labelMode = "editable",
  onChangeInputLabel: onChangeInputLabelOrigin,
  onChangeValue,
  handleDeleteDataItem,
  drawImageList = [],
  refAdditionalDrawCanvas,
  drawBorderLineWidthPercent,
  drawBorderLineColor,
  scale = 1.3,
  position = [0, -0.5, 0],

  ...restProps
}) => {
  const refCanvas = useRef();
  const refCacheData = useRef();

  const setCanvasCursor = useCallback(() => {
    refCanvas.current.style.cursor = "pointer";
  }, []);
  const setCanvasCursorAsDefault = useCallback(() => {
    refCanvas.current.style.cursor = "default";
  }, []);

  const [springStyleRadarGroup, setRadarGroupSpring] = useSpring(
    () => ({
      scale,
      position,
    }),
    [scale, position]
  );

  const saveImage = useCallback(async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const { width, height } = refCanvas.current;
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    console.log(width, height);

    // console.log(refCanvas.current);
    ctx.drawImage(refCanvas.current, 0, 0);

    // refAdditionalDrawCanvas.current.app.render();
    refAdditionalDrawCanvas.current &&
      ctx.drawImage(
        refAdditionalDrawCanvas.current.app.view,
        0,
        0,
        width,
        height
      );

    if (drawBorderLineColor && drawBorderLineWidthPercent) {
      ctx.lineWidth = width * drawBorderLineWidthPercent * 2;
      ctx.strokeStyle = drawBorderLineColor;
      ctx.strokeRect(0, 0, width, height);
    }

    await Promise.all(
      drawImageList.map(({ src, x, y, width, height }) => {
        return new Promise((resolve, reject) => {
          let img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = () => {
            ctx.drawImage(img, x, y, width, height);
            resolve();
          };
          img.onerror = reject;
          img.src = src + "?time=" + new Date().valueOf();
        });
      })
    );

    canvasToImage(canvas, nameSavedImage);
  }, [drawImageList]);

  // const autoDetectFocusPointIndex = useMemo(() => {
  //   if (!refCacheData.current) {
  //     refCacheData.current = data;
  //     return false;
  //   }

  //   if (isAutoDetectFocusPointIndex) {
  //     const diffIndex = data.findIndex((item, index) => {
  //       // console.log(Object.keys(difference(item, refCacheData.current[index])));
  //       return (
  //         Object.keys(difference(item, refCacheData.current[index])).length !==
  //         0
  //       );
  //     });
  //     refCacheData.current = data;

  //     return diffIndex === -1 ? false : diffIndex.toString();
  //   } else {
  //     return false;
  //   }
  // }, [data]);

  const prepareToSaveImage = useCallback(() => {}, []);

  useEffect(() => {
    if (isTriggerSaveImage) {
      saveImage();
      onCompleteSaveImage();
    }
    return () => {};
  }, [isTriggerSaveImage]);

  const positionAbilityPlate = useMemo(
    () => [
      0,
      0,
      0 + offsetY * 1.3 + 0.001,
      // 0.15
    ],
    []
  );

  const onChangeInputLabel = useCallback((e) => {
    const {
      value,
      dataset: { index: indexString },
    } = e.target;
    onChangeInputLabelOrigin(value, parseInt(indexString));
  }, []);

  const numAbility = data.length < 3 ? 3 : data.length;

  const defaultGroupPosition = useMemo(() => [0, -0.5, 0], []);

  return (
    <div
      className={cx(sty.ThreeRadarChart, className)}
      // onClick={saveImage}
    >
      <Canvas
        shadows
        key={canvasBgColor}
        alpha
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ camera, gl, scene, viewport }) => {
          gl.setPixelRatio(window.devicePixelRatio || 2);
          refCanvas.current = gl.domElement;
          if (canvasBgColor && canvasBgColor !== "transparent") {
            scene.background = new THREE.Color(canvasBgColor);
          } else {
            scene.background = null;
            gl.setClearColor(0x000000, 0);
          }
        }}
        {...restProps}
      >
        <a.group {...springStyleRadarGroup}>
          <BgClickOut />
          <BgRadarChart
            data={data}
            numAbility={numAbility}
            numLayer={maxValue}
            color={abilityPlateBgColor}
            outlineColor={outlineColor}
            centerOutLineColor={centerOutLineColor}
            outOutlineStrokeWidth={outOutlineStrokeWidth}
            fontColor={fontColor}
            textHeight={textHeight}
            textStrokeWidth={textStrokeWidth}
            textStrokeColor={textStrokeColor}
            offsetY={offsetY}
            lengthRadius={lengthRadius}
            labelMode={labelMode}
            onChangeInputLabel={onChangeInputLabel}
            onChangeValue={onChangeValue}
            labelMode={labelMode}
            setCanvasCursor={setCanvasCursor}
            setCanvasCursorAsDefault={setCanvasCursorAsDefault}
            handleDeleteDataItem={handleDeleteDataItem}
          />
          <AbilityPlate
            data={data}
            maxValue={maxValue}
            color={abilityPlateColor}
            outlineColor={outlineColor}
            position={positionAbilityPlate}
            lengthRadius={lengthRadius}
          />
        </a.group>
        {children}
        <Camera
          // focusPointIndex={autoDetectFocusPointIndex || focusPointIndex}
          control={control}
          numAbility={numAbility}
          lengthRadius={lengthRadius}
          centerPoint={centerPoint}
        />
        {/* {refCanvas.current && (
          <Effects>
            <shaderPass
              attachArray="passes"
              args={[FXAAShader]}
              material-uniforms-resolution-value={[
                1 / refCanvas.current.width,
                1 / refCanvas.current.height,
              ]}
              renderToScreen
            />
          </Effects>
        )} */}
        {/* {control && <OrbitControls />} */}
      </Canvas>
    </div>
  );
};

ThreeRadarChart.propTypes = {
  labelMode: PropTypes.oneOf([
    "editable", // auto switch to input if click label
    "edit", // input mode
    "display", // canvas sprite
  ]),
  isTriggerSaveImage: PropTypes.bool,
  onCompleteSaveImage: PropTypes.func,
  nameSavedImage: PropTypes.string,
  maxValue: PropTypes.number,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.number,
    })
  ),
  drawImageList: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string,
      x: PropTypes.number,
      y: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
    })
  ),
  refAdditionalDrawCanvas: PropTypes.object,
  onChangeInputLabel: PropTypes.func,
  canvasBgColor: PropTypes.string,
  fontColor: PropTypes.string,
  outlineColor: PropTypes.string,
  outOutlineStrokeWidth: PropTypes.number,
  abilityPlateBgColor: PropTypes.string,
  abilityPlateColor: PropTypes.string,
  focusPointIndex: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
};

export default ThreeRadarChart;

// function difference(object, base) {
//   return _.transform(object, (result, value, key) => {
//     if (!_.isEqual(value, base[key])) {
//       result[key] =
//         _.isObject(value) && _.isObject(base[key])
//           ? difference(value, base[key])
//           : value;
//     }
//   });
// }
