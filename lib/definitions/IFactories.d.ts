declare module HatcheryRuntime {

    /**
     * This factory is used to create Animate behaviour objects
     */
    export interface IBehaviourFactory {

        /**
         * Creates a new behaviour
         * @param {any} data The data object which defines what to create
         * @param {Runtime} runtime The runtime we are adding this behaviour to
         * @returns {Behaviour} The Behaviour we have created
         */
        create( data: any, runtime: Runtime ): Behaviour;
    }

    /**
     * This factory is used to create Animate asset objects
     */
    export interface IAssetFactory {

        /**
        * Creates a new Asset
        * @param {any} data The data object which defines what to create
        * @param {Runtime} runtime The runtime we are adding this behaviour to
        * @returns {Asset} The {Asset} we have created
        */
        create(data: any, runtime: Runtime): Asset;
    }
}
