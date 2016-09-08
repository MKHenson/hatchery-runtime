declare module HatcheryRuntime {

    /**
     * Describes a plugin interface which plugin writers can implement to interact with the runtime
     */
    export interface IPlugin {

        /**
        * Called when we enter a frame
        * @param {number} totalTime The total time from the start of the application
        * @param {number} delta The time between frames
        */
        onFrame(totalTime: number, delta: number);

        /**
        * Called whenever we enter a container
        * @param {Container} container The container we are entering
        */
        onContainerEnter(container : Container );

        /**
        * Called whenever a container makes progress in its loading
        * @param {Container} container The container thats being loaded
        * @param {number} percentage The percentage of the loading processs
        */
        onLoadProgress(container: Container, percentage: number);


        /**
        * Called when a container is exited. The container might still be active.
        * @param {Container} container The container we are entering
        * @param {Portal} portal The portal used
        * @param {any} stillActive Is this container still running.
        */
        onContainerExit(container: Container, portal: Portal, stillActive: boolean);

        /**
        * Cleans up the plugin
        */
        dispose();
    }
}