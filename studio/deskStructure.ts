// deskStructure.ts
import S from "@sanity/desk-tool/structure-builder";

export default () =>
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
        .child(S.documentTypeList("exerciseEntry")),
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
    ]);
