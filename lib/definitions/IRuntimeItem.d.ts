declare module HatcheryRuntime {

    /**
     * A common interface for links and behaviours
     */
    export interface IRuntimeItem {
        /**
        * Called when we enter a frame
        * @param {number} totalTime The total time from the start of the application
        * @param {number} delta The time between frames
        */
        onFrame( totalTime: number, delta: number );

        /**
        * Cleans up the object for garbage collection
        */
        dispose();

        /**
        * Notify if the item is disposed
        */
        disposed: boolean;
    }
}
