import { TrackedItem } from "./types";

export const getInitialTrackedItems = (): TrackedItem[] => {
  const now = new Date();
  
  // Create Date strings for history
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "tv_1399", // Breaking Bad
      tmdbId: 1399,
      title: "بريكنج باد | Breaking Bad",
      originalTitle: "Breaking Bad",
      type: "tv",
      category: "series",
      status: "watching",
      posterPath: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg", // Verified TMDB path
      backdropPath: "/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg", // Verified TMDB path
      releaseDate: "2008-01-20",
      overview: "والتر وايت معلم كيمياء عبقري في مدرسة ثانوية، يُشخّص بسرطان الرئة فيقرر إنتاج المخدرات لتأمين مستقبل عائلته المالي قبل وفاته، بمساعدة طالبه السابق جيسي بينكمان.",
      rating: 8.9,
      genres: ["دراما", "جريمة"],
      favorite: true,
      addedAt: threeWeeksAgo,
      updatedAt: now.toISOString(),
      currentSeason: 4,
      totalSeasons: 5,
      seasons: [
        {
          seasonNumber: 1,
          name: "الموسم 1",
          episodeCount: 7,
          episodes: Array.from({ length: 7 }, (_, i) => ({
            episodeNumber: i + 1,
            name: `الحلقة ${i + 1}`,
            completed: true
          }))
        },
        {
          seasonNumber: 2,
          name: "الموسم 2",
          episodeCount: 13,
          episodes: Array.from({ length: 13 }, (_, i) => ({
            episodeNumber: i + 1,
            name: `الحلقة ${i + 1}`,
            completed: true
          }))
        },
        {
          seasonNumber: 3,
          name: "الموسم 3",
          episodeCount: 13,
          episodes: Array.from({ length: 13 }, (_, i) => ({
            episodeNumber: i + 1,
            name: `الحلقة ${i + 1}`,
            completed: true
          }))
        },
        {
          seasonNumber: 4,
          name: "الموسم 4",
          episodeCount: 13,
          episodes: Array.from({ length: 13 }, (_, i) => ({
            episodeNumber: i + 1,
            name: `الحلقة ${i + 1}`,
            completed: i < 9 // Watched S4 • E9 (first 9 episodes checked)
          }))
        },
        {
          seasonNumber: 5,
          name: "الموسم 5",
          episodeCount: 16,
          episodes: Array.from({ length: 16 }, (_, i) => ({
            episodeNumber: i + 1,
            name: `الحلقة ${i + 1}`,
            completed: false
          }))
        }
      ]
    },
    {
      id: "movie_157336", // Interstellar
      tmdbId: 157336,
      title: "بين النجوم | Interstellar",
      originalTitle: "Interstellar",
      type: "movie",
      category: "movie",
      status: "completed",
      posterPath: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg", // Verified TMDB path
      backdropPath: "/2ssWTSVklAEc98frZUQhgtGHx7s.jpg", // Verified TMDB path
      releaseDate: "2014-11-05",
      overview: "مجموعة من المستكشفين يسافرون عبر ثقب دودي في الفضاء الخارجي لضمان بقاء البشرية على كوكب آخر بعد أن أصبحت الأرض بيئة غير صالحة للعيش.",
      runtime: 169,
      rating: 8.4,
      genres: ["مغامرة", "دراما", "خيال علمي"],
      favorite: true,
      addedAt: lastWeek,
      updatedAt: twoDaysAgo,
      completedAt: twoDaysAgo
    },
    {
      id: "tv_1429", // Attack on Titan
      tmdbId: 1429,
      title: "هجوم العمالقة | Attack on Titan",
      originalTitle: "Attack on Titan",
      type: "tv",
      category: "anime",
      status: "watching",
      posterPath: "/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg", // Verified TMDB path
      backdropPath: "/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg", // Verified TMDB path
      releaseDate: "2013-04-07",
      overview: "منذ قرون، أُجبرت البشرية على العيش خلف أسوار هائلة لحماية أنفسهم من العمالقة الآكلين للبشر. تنقلب حياة إرين ييغر رأسًا على عقب عندما ينجح عملاق ضخم في اختراق الجدار الخارجي.",
      rating: 8.7,
      genres: ["أنمي", "أكشن", "خيال علمي"],
      favorite: false,
      addedAt: lastWeek,
      updatedAt: now.toISOString(),
      currentSeason: 1,
      totalSeasons: 4,
      seasons: [
        {
          seasonNumber: 1,
          name: "الموسم 1",
          episodeCount: 25,
          episodes: Array.from({ length: 25 }, (_, i) => ({
            episodeNumber: i + 1,
            name: `الحلقة ${i + 1}`,
            completed: i < 3 // Watched S1 • E3 (first 3 episodes checked)
          }))
        }
      ]
    }
  ];
};
