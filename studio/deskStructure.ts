// deskStructure.ts
import S from "@sanity/desk-tool/structure-builder";

export default (_, context) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Weeks")
        .schemaType("week")
        .child(S.documentTypeList("week")),
      S.listItem()
        .title("Sessions")
        .schemaType("session")
        .child(S.documentTypeList("session")),
      S.listItem()
        .title("Exercise Entries")
        .schemaType("exerciseEntry")
        .child(
          S.list()
            .title("Exercise Entries")
            .items([
              S.listItem()
                .title("All Entries")
                .schemaType("exerciseEntry")
                .child(S.documentTypeList("exerciseEntry")),
              S.listItem()
                .title("By User")
                .child(
                  S.list()
                    .title("Users")
                    .items(async () => {
                      const client = context.getClient({ apiVersion: "2023-10-01" });
                      const userIds = await client.fetch(
                        'array::unique(*[_type=="exerciseEntry" && defined(userId)].userId)'
                      );
                      return userIds.map(userId =>
                        S.listItem()
                          .title(userId)
                          .schemaType("exerciseEntry")
                          .child(
                            S.documentList()
                              .title(`Exercise Entries: ${userId}`)
                              .schemaType("exerciseEntry")
                              .filter('_type == "exerciseEntry" && userId == $userId')
                              .params({ userId })
                          )
                      );
                    })
                ),
            ])
        ),
      S.listItem()
        .title("Nutrition Days")
        .schemaType("nutritionDay")
        .child(S.documentTypeList("nutritionDay")),
      S.listItem()
        .title("Meals")
        .schemaType("meal")
        .child(S.documentTypeList("meal")),
      S.listItem()
        .title("Plans")
        .schemaType("plan")
        .child(S.documentTypeList("plan")),
      S.listItem()
        .title("Exercises")
        .schemaType("exercise")
        .child(S.documentTypeList("exercise")),
      S.listItem()
        .title("Affiliate Promotions")
        .schemaType("affiliatePromotion")
        .child(S.documentTypeList("affiliatePromotion")),
      S.listItem()
        .title("Nearby Places")
        .schemaType("nearbyPlace")
        .child(S.documentTypeList("nearbyPlace")),
      S.listItem()
        .title("Gym Locations")
        .schemaType("gymLocation")
        .child(S.documentTypeList("gymLocation")),
    ]);
