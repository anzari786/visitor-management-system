declare module 'html5-qrcode' {
   export type QrcodeSuccessCallback = (
      decodedText: string,
      decodedResult?: unknown,
   ) => void;

   export type QrcodeErrorCallback = (errorMessage: string) => void;

   export type QrDimensions = {
      width: number;
      height: number;
   };

   export type QrDimensionFunction = (
      viewfinderWidth: number,
      viewfinderHeight: number,
   ) => QrDimensions;

   export type Html5QrcodeCameraScanConfig = {
      fps?: number;
      qrbox?: number | QrDimensions | QrDimensionFunction;
      aspectRatio?: number;
      disableFlip?: boolean;
      videoConstraints?: MediaTrackConstraints;
   };

   export type Html5QrcodeFullConfig = {
      verbose?: boolean;
      useBarCodeDetectorIfSupported?: boolean;
   };

   export type CameraDevice = {
      id: string;
      label: string;
   };

   export class Html5Qrcode {
      constructor(
         elementId: string,
         configOrVerbosityFlag?: boolean | Html5QrcodeFullConfig,
      );

      readonly isScanning: boolean;

      start(
         cameraIdOrConfig: string | MediaTrackConstraints,
         configuration: Html5QrcodeCameraScanConfig,
         qrCodeSuccessCallback: QrcodeSuccessCallback,
         qrCodeErrorCallback?: QrcodeErrorCallback,
      ): Promise<null>;

      stop(): Promise<void>;

      clear(): void;

      static getCameras(): Promise<CameraDevice[]>;
   }
}
