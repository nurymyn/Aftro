# Mobile app

Target both Android and iOS with one Unity C# project. Add Unity AR Foundation
and the platform providers for Android (ARCore) and iOS (ARKit). Use an Android
or iOS device that supports the relevant provider for the first demo.

## First camera demo

1. Retrieve the apartment and two finish options from the catalog API.
2. Load the same measured room model for both options.
3. Use the real room's floor and two reference points to align the model.
   The first point sets the origin and the second sets its direction.
4. Anchor the model in that position. Change materials and furnishings when
   the user changes the finish option.

For a real device test, use a reachable development API endpoint. A phone's
localhost points to the phone itself.

Evaluate Apple RoomPlan separately once automatic scanning is in scope.
