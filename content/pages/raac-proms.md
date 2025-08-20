---
title: RAAC PROMs - Suivi Patient
slug: raac-proms
sections:
  - title:
      text: RAAC PROMs - Suivi Patient
      color: text-dark
      styles:
        self:
          textAlign: center
      type: TitleBlock
    subtitle: Solution digitale de suivi des Patient Reported Outcome Measures
    text: >
      Plateforme médicale professionnelle développée pour la Polyclinique Côte Basque Sud.
      Suivi complet des patients en chirurgie orthopédique avec questionnaires standardisés
      Oxford et WOMAC, rappels automatiques et portail patient sécurisé.
    actions:
      - label: Accéder au système
        url: /raac-proms
        icon: arrowRight
        iconPosition: right
        style: primary
        type: Button
      - label: Documentation médicale
        url: https://polyclinique-cotebasquesud.fr/la-polyclinique/
        icon: arrowRight
        iconPosition: right
        style: secondary
        type: Button
    colors: bg-light-fg-dark
    styles:
      self:
        padding:
          - pt-32
          - pb-32
          - pl-4
          - pr-4
        alignItems: center
        flexDirection: col
        justifyContent: center
      text:
        textAlign: center
      subtitle:
        textAlign: center
    type: GenericSection
    backgroundImage:
      type: BackgroundImage
      url: /images/abstract-background.svg
      backgroundSize: cover
      backgroundPosition: center
      backgroundRepeat: no-repeat
      opacity: 5
  - title:
      text: Fonctionnalités Médicales
      color: text-dark
      styles:
        self:
          textAlign: center
      type: TitleBlock
    subtitle: Outils professionnels pour l'équipe soignante
    items:
      - title: Dossier Patient Numérique
        subtitle: Gestion centralisée
        text: >
          Base de données sécurisée des patients avec informations médicales,
          dates d'intervention chirurgicale et coordonnées pour le suivi post-opératoire.
        image:
          url: /images/icon1.svg
          altText: Gestion patients
          type: ImageBlock
        colors: bg-neutralAlt-fg-dark
        styles:
          self:
            padding:
              - pt-8
              - pl-8
              - pb-8
              - pr-8
            borderRadius: x-large
            flexDirection: row
            textAlign: left
        type: FeaturedItem
      - title: Scores Oxford & WOMAC
        subtitle: Évaluation clinique standardisée
        text: >
          Questionnaires validés scientifiquement : Oxford Hip/Knee Score (12 items)
          et WOMAC (24 items) avec calcul automatique et suivi longitudinal.
        image:
          url: /images/icon2.svg
          altText: Questionnaires médicaux
          type: ImageBlock
        colors: bg-neutralAlt-fg-dark
        styles:
          self:
            padding:
              - pt-8
              - pl-8
              - pb-8
              - pr-8
            borderRadius: x-large
            flexDirection: row
            textAlign: left
        type: FeaturedItem
      - title: Rappels Automatisés
        subtitle: Communication patient optimisée
        text: >
          Système de rappels email automatiques avec modèles personnalisables,
          export calendrier (.ics) et suivi des échéances par timepoint.
        image:
          url: /images/icon3.svg
          altText: Rappels automatiques
          type: ImageBlock
        colors: bg-neutralAlt-fg-dark
        styles:
          self:
            padding:
              - pt-8
              - pl-8
              - pb-8
              - pr-8
            borderRadius: x-large
            flexDirection: row
            textAlign: left
        type: FeaturedItem
      - title: Portail Patient Sécurisé
        subtitle: Accès patient autonome
        text: >
          Interface patient dédiée avec authentification sécurisée permettant
          la consultation de l'évolution des scores et graphiques interactifs.
        image:
          url: /images/icon1.svg
          altText: Portail patient
          type: ImageBlock
        colors: bg-neutralAlt-fg-dark
        styles:
          self:
            padding:
              - pt-8
              - pl-8
              - pb-8
              - pr-8
            borderRadius: x-large
            flexDirection: row
            textAlign: left
        type: FeaturedItem
      - title: Tableaux de Bord Médicaux
        subtitle: Analytics et reporting
        text: >
          Statistiques avancées avec moyennes par timepoint, taux de complétude,
          filtres par articulation et indicateurs de qualité des soins.
        image:
          url: /images/icon2.svg
          altText: Statistiques médicales
          type: ImageBlock
        colors: bg-neutralAlt-fg-dark
        styles:
          self:
            padding:
              - pt-8
              - pl-8
              - pb-8
              - pr-8
            borderRadius: x-large
            flexDirection: row
            textAlign: left
        type: FeaturedItem
      - title: Export & Interopérabilité
        subtitle: Intégration système
        text: >
          Export CSV complet pour analyses statistiques externes,
          sauvegarde automatique et API d'intégration avec le SIH.
        image:
          url: /images/icon3.svg
          altText: Export données
          type: ImageBlock
        colors: bg-neutralAlt-fg-dark
        styles:
          self:
            padding:
              - pt-8
              - pl-8
              - pb-8
              - pr-8
            borderRadius: x-large
            flexDirection: row
            textAlign: left
        type: FeaturedItem
    variant: two-col-grid
    colors: bg-neutral-fg-dark
    styles:
      self:
        padding:
          - pt-16
          - pl-16
          - pb-16
          - pr-16
        justifyContent: center
      subtitle:
        textAlign: center
    type: FeaturedItemsSection
  - title:
      text: Protocole RAAC Intégré
      color: text-dark
      styles:
        self:
          textAlign: center
      type: TitleBlock
    subtitle: Récupération Améliorée Après Chirurgie
    text: >
      Cette application s'intègre parfaitement dans le protocole RAAC de la Polyclinique
      Côte Basque Sud, permettant un suivi standardisé et une amélioration continue
      de la qualité des soins en chirurgie orthopédique.
    actions:
      - label: En savoir plus sur RAAC
        url: https://polyclinique-cotebasquesud.fr/la-polyclinique/
        icon: arrowRight
        iconPosition: right
        style: secondary
        type: Button
    colors: bg-light-fg-dark
    styles:
      self:
        padding:
          - pt-20
          - pb-20
          - pl-4
          - pr-4
        alignItems: center
        flexDirection: col
        justifyContent: center
      text:
        textAlign: center
      subtitle:
        textAlign: center
    type: GenericSection
seo:
  metaTitle: RAAC PROMs - Polyclinique Côte Basque Sud
  metaDescription: Système de suivi des Patient Reported Outcome Measures pour la chirurgie orthopédique - Polyclinique Côte Basque Sud. Questionnaires Oxford et WOMAC, rappels automatiques.
  socialImage: /images/main-hero.jpg
  type: Seo
colors: bg-light-fg-dark
type: PageLayout
---