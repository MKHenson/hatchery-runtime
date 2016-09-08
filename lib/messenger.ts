namespace HatcheryRuntime {

    /**
     * This singleton class is used to relay messages within the application
     */
    export class Messenger extends EventDispatcher {
        private static _singleton: Messenger;

        constructor() {
            super();

            if ( Messenger._singleton !== null )
                throw new Error('The Messenger class is a singleton. You need to call the Messenger.getSingleton() function.');

            Messenger._singleton = this;
        }

        /**
         * Use this function to get the global {Messenger} singleton
         * @returns {Messenger}
         */
        static getSingleton(): Messenger {
            if ( !Messenger._singleton )
                new Messenger();

            return Messenger._singleton;
        }
    }
}
