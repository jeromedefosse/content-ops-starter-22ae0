---
title: Home
slug: /
sections:
  - type: GenericSection
    title:
      text: RAAC PROMs - Suivi Patient Polyclinique Côte Basque Sud
      color: text-dark
      type: TitleBlock
    subtitle: Solution digitale de suivi des Patient Reported Outcome Measures
    text: >
      Plateforme médicale professionnelle développée pour la Polyclinique Côte Basque Sud.
      Suivi complet des patients en chirurgie orthopédique avec questionnaires standardisés
      Oxford et WOMAC, rappels automatiques et portail patient sécurisé.
    actions:
      - label: Accéder au système RAAC
        altText: ''
        url: /raac-proms
        showIcon: false
        icon: arrowRight
        iconPosition: right
        style: primary
        elementId: ''
        type: Button
      - label: Documentation médicale
        altText: ''
        url: https://polyclinique-cotebasquesud.fr/la-polyclinique/
        showIcon: true
        icon: arrowRight
        iconPosition: right
        style: secondary
        elementId: ''
        type: Button
    media:
      url: /images/main-hero.svg
      altText: RAAC PROMs - Système de suivi patient
      elementId: ''
      type: ImageBlock
    badge:
      label: Système Médical RAAC
      color: text-primary
      type: Badge
    elementId: ''
    colors: bg-light-fg-dark
    styles:
      self:
        alignItems: center
        flexDirection: row
        padding:
          - pt-16
          - pl-16
          - pb-16
          - pr-16
  - type: FeaturedItemsSection
    title:
      text: Fonctionnalités Médicales
      color: text-dark
      styles:
        self:
          textAlign: center
      type: TitleBlock
    subtitle: Outils professionnels pour l'équipe soignante
    items:
      - type: FeaturedItem
        title: Dossier Patient Numérique
        subtitle: Gestion centralisée
        text: >-
          Base de données sécurisée des patients avec informations médicales,
          dates d'intervention chirurgicale et coordonnées pour le suivi post-opératoire.
        actions: []
        elementId: null
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
            justifyContent: center
            textAlign: left
        image:
          type: ImageBlock
          altText: Gestion patients
          elementId: ''
          url: /images/icon1.svg
          styles:
            self:
              borderRadius: x-large
      - title: Scores Oxford & WOMAC
        subtitle: Évaluation clinique standardisée
        text: >-
          Questionnaires validés scientifiquement : Oxford Hip/Knee Score (12 items)
          et WOMAC (24 items) avec calcul automatique et suivi longitudinal.
        image:
          url: /images/icon2.svg
          altText: Questionnaires médicaux
          elementId: ''
          type: ImageBlock
        actions: []
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
            justifyContent: center
        type: FeaturedItem
      - title: Rappels Automatisés
        subtitle: Communication patient optimisée
        text: >-
          Système de rappels email automatiques avec modèles personnalisables,
          export calendrier (.ics) et suivi des échéances par timepoint.
        image:
          url: /images/icon3.svg
          altText: Rappels automatiques
          elementId: ''
          type: ImageBlock
        actions: []
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
        type: FeaturedItem
    actions:
      - label: Accéder au système
        altText: ''
        url: /raac-proms
        showIcon: false
        icon: arrowRight
        iconPosition: right
        style: primary
        elementId: ''
        type: Button
    badge:
      label: Système RAAC
      color: text-primary
      styles:
        self:
          textAlign: center
      type: Badge
    elementId: ''
    variant: three-col-grid
    colors: bg-neutral-fg-dark
    styles:
      self:
        padding:
          - pb-16
          - pt-16
          - pl-16
          - pr-16
        justifyContent: center
      subtitle:
        textAlign: center
  - subtitle: Partenaires de confiance en santé
    images:
      - url: /images/empathy-logo.svg
        altText: Partenaire médical
        type: ImageBlock
      - url: /images/wellster-logo.svg
        altText: Partenaire santé
        type: ImageBlock
      - url: /images/vise-logo.svg
        altText: Partenaire technologique
        type: ImageBlock
      - url: /images/telus-logo.svg
        altText: Partenaire médical
        type: ImageBlock
      - url: /images/contenful-logo.svg
        altText: Partenaire technologique
        type: ImageBlock
      - url: /images/sanity-logo.svg
        altText: Partenaire médical
        type: ImageBlock
      - url: /images/rangle-logo.svg
        altText: Partenaire technologique
        type: ImageBlock
    motion: move-to-left
    colors: bg-light-fg-dark
    styles:
      self:
        justifyContent: center
      subtitle:
        textAlign: center
    type: ImageGallerySection
  - posts:
      - content/pages/blog/case-study-1.md
      - content/pages/blog/case-study-2.md
      - content/pages/blog/case-study-3.md
    showThumbnail: true
    showDate: true
    showAuthor: true
    variant: three-col-grid
    colors: bg-light-fg-dark
    styles:
      self:
        padding:
          - pt-16
          - pl-16
          - pb-16
          - pr-16
        justifyContent: center
    type: FeaturedPostsSection
    hoverEffect: move-up
  - title: Divider
    colors: bg-light-fg-dark
    styles:
      self:
        padding:
          - pt-7
          - pl-7
          - pb-7
          - pr-7
    type: DividerSection
  - title:
      text: Améliorer la qualité des soins
      color: text-dark
      styles:
        self:
          textAlign: center
      type: TitleBlock
    subtitle: Protocole RAAC intégré
    text: |-
      Notre système RAAC PROMs s'intègre parfaitement dans le protocole de
      Récupération Améliorée Après Chirurgie de la Polyclinique Côte Basque Sud,
      permettant un suivi standardisé et une amélioration continue de la qualité
      des soins en chirurgie orthopédique.
    media:
      title: Title of the video
      url: /images/placeholder-video.mp4
      controls: false
      aspectRatio: '16:9'
      styles:
        self:
          padding:
            - pt-2
            - pb-2
            - pl-2
            - pr-2
          borderColor: border-dark
          borderStyle: solid
          borderWidth: 1
          borderRadius: large
      type: VideoBlock
      autoplay: true
      loop: true
      muted: true
    badge:
      label: Protocole RAAC
      color: text-primary
      styles:
        self:
          textAlign: center
      type: Badge
    colors: bg-light-fg-dark
    styles:
      self:
        flexDirection: col
        justifyContent: center
      subtitle:
        textAlign: center
    type: GenericSection
  - type: GenericSection
    title:
      text: Formation et Support
      color: text-dark
      styles:
        self:
          textAlign: left
      type: TitleBlock
    subtitle: Accompagnement de l'équipe médicale
    text: |-
      Formation complète de l'équipe soignante à l'utilisation du système,
      support technique dédié et documentation médicale pour optimiser
      l'adoption et garantir la qualité du suivi patient.
    actions: []
    media:
      title: Title of the video
      url: /images/placeholder-video.mp4
      autoplay: true
      loop: true
      muted: true
      controls: false
      aspectRatio: '16:9'
      styles:
        self:
          padding:
            - pt-2
            - pb-2
            - pl-2
            - pr-2
          borderColor: border-dark
          borderStyle: solid
          borderWidth: 1
          borderRadius: large
      type: VideoBlock
    elementId: null
    colors: bg-light-fg-dark
    styles:
      self:
        flexDirection: row
        justifyContent: center
      subtitle:
        textAlign: left
  - title:
      text: Portail Patient Sécurisé
      color: text-dark
      type: TitleBlock
    subtitle: Accès patient autonome
    text: >
      Interface patient dédiée avec authentification sécurisée permettant
      la consultation de l'évolution des scores et graphiques interactifs.
    actions:
      - label: Voir le portail patient
        url: /raac-proms?patient=demo&token=demo
        icon: arrowRight
        iconPosition: right
        style: secondary
        type: Button
      - label: Documentation
        url: https://polyclinique-cotebasquesud.fr/la-polyclinique/
        showIcon: true
        icon: arrowRight
        iconPosition: right
        style: primary
        type: Link
    media:
      url: /images/hero2.svg
      altText: Portail patient sécurisé
      type: ImageBlock
    badge:
      label: Sécurisé
      color: text-primary
      type: Badge
    colors: bg-light-fg-dark
    styles:
      self:
        alignItems: center
    type: GenericSection
  - title:
      text: Tableaux de Bord Médicaux
      color: text-dark
      type: TitleBlock
    subtitle: Analytics et reporting
    text: >
      Statistiques avancées avec moyennes par timepoint, taux de complétude,
      filtres par articulation et indicateurs de qualité des soins.
    actions:
      - label: Voir les statistiques
        url: /raac-proms
        icon: arrowRight
        iconPosition: right
        style: secondary
        type: Button
      - label: Export données
        url: /raac-proms
        showIcon: true
        icon: arrowRight
        iconPosition: right
        style: primary
        type: Link
    media:
      url: /images/hero3.svg
      altText: Tableaux de bord médicaux
      type: ImageBlock
    badge:
      label: Analytics
      color: text-primary
      type: Badge
    colors: bg-light-fg-dark
    styles:
      self:
        alignItems: center
        flexDirection: row-reverse
    type: GenericSection
  - title: Divider
    colors: bg-light-fg-dark
    styles:
      self:
        padding:
          - pt-7
          - pl-7
          - pb-7
          - pr-7
    type: DividerSection
  - type: CarouselSection
    title: null
    subtitle: What our customers say about us
    items:
      - title: >-
          “A designer knows he has achieved perfection not when there is nothing
          left to add, but when there is nothing left to take away.”
        tagline: Testimonial 1
        subtitle: 'Maria Walters, Company'
        text: >-
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.
          explicabo.
        image:
          url: /images/person-placeholder-light.png
          altText: Maria Walters
          styles:
            self:
              borderRadius: full
          type: ImageBlock
        actions: []
        colors: bg-neutralAlt-fg-dark
        styles:
          self:
            padding:
              - pt-9
              - pb-9
              - pl-9
              - pr-9
            textAlign: left
            borderRadius: large
            flexDirection: row
            justifyContent: center
        type: FeaturedItem
      - title: >-
          "Design is a plan for arranging elements in such a way as best to accomplish a particular purpose."
        tagline: Testimonial 2
        subtitle: 'John Doe, Company'
        text: >-
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.
          explicabo.
        image:
          url: /images/person-placeholder-light.png
          altText: John Doe
          styles:
            self:
              borderRadius: full
          type: ImageBlock
        actions: []
        colors: bg-neutralAlt-fg-dark
        styles:
          self:
            padding:
              - pt-9
              - pb-9
              - pl-9
              - pr-9
            textAlign: left
            borderRadius: large
            flexDirection: row
            justifyContent: center
        type: FeaturedItem
      - title: >-
          "Design is how it works, how it functions. Good design doesn't just make a product aesthetically pleasing, it makes it a pleasure to use."
        tagline: Testimonial 3
        subtitle: 'Maria Walters, Company'
        text: >-
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.
          explicabo.
        image:
          url: /images/person-placeholder-light.png
          altText: Maria Walters
          styles:
            self:
              borderRadius: full
          type: ImageBlock
        actions: []
        colors: bg-neutralAlt-fg-dark
        styles:
          self:
            padding:
              - pt-9
              - pb-9
              - pl-9
              - pr-9
            textAlign: left
            borderRadius: large
            flexDirection: row
            justifyContent: center
        type: FeaturedItem
      - title: >-
          “A designer knows he has achieved perfection not when there is nothing
          left to add, but when there is nothing left to take away.”
        tagline: Testimonial 4
        subtitle: 'Maria Walters, Company'
        text: >-
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.
          explicabo.
        image:
          url: /images/person-placeholder-light.png
          altText: Maria Walters
          styles:
            self:
              borderRadius: full
          type: ImageBlock
        actions: []
        colors: bg-neutralAlt-fg-dark
        styles:
          self:
            padding:
              - pt-9
              - pb-9
              - pl-9
              - pr-9
            textAlign: left
            borderRadius: large
            flexDirection: row
            justifyContent: center
        type: FeaturedItem
      - title: >-
          "Design can be art. Design can be aesthetics. Design is so simple, that's why it is so complicated."
        tagline: Testimonial 5
        subtitle: 'Jane Walters, Company'
        text: >-
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.
          explicabo.
        image:
          url: /images/person-placeholder-light.png
          altText: Maria Walters
          styles:
            self:
              borderRadius: full
          type: ImageBlock
        actions: []
        colors: bg-neutralAlt-fg-dark
        styles:
          self:
            padding:
              - pt-9
              - pb-9
              - pl-9
              - pr-9
            textAlign: left
            borderRadius: large
            flexDirection: row
            justifyContent: center
        type: FeaturedItem
      - title: >-
          “Quote from some important person goes right here. I love using Netlify Create.”
        tagline: Testimonial 6
        subtitle: 'Jane Doe, Company'
        text: >-
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.
          explicabo.
        image:
          url: /images/img-placeholder-dark.png
          altText: Jane Doe
          styles:
            self:
              borderRadius: full
          type: ImageBlock
        actions: []
        colors: bg-dark-fg-light
        styles:
          self:
            padding:
              - pt-9
              - pb-9
              - pl-9
              - pr-9
            textAlign: left
            borderRadius: large
            flexDirection: row
            justifyContent: center
        type: FeaturedItem
    elementId: null
    variant: next-prev-nav
    colors: bg-light-fg-dark
    styles:
      self:
        justifyContent: center
      subtitle:
        textAlign: center
  - title:
      text: Fonctionnalités Avancées
      color: text-primary
      styles:
        self:
          textAlign: center
      type: TitleBlock
    subtitle: Outils complémentaires pour l'équipe médicale
    items:
      - title: Feature Item One
        tagline: Export & Interopérabilité
        subtitle: Intégration système
        text: |
          Export CSV complet pour analyses statistiques externes,
          sauvegarde automatique et API d'intégration avec le SIH.
        image:
          url: /images/abstract-feature1.svg
          altText: Export données
          styles:
            self:
              borderRadius: x-large
          type: ImageBlock
        colors: bg-light-fg-dark
        styles:
          self:
            padding:
              - pt-8
              - pl-8
              - pb-8
              - pr-8
            borderRadius: x-large
            flexDirection: col
        type: FeaturedItem
      - title: Feature Item Two
        tagline: Rappels Intelligents
        subtitle: Communication automatisée
        text: |
          Système de rappels email automatiques avec modèles personnalisables
          et export calendrier pour une communication patient optimisée.
        image:
          url: /images/abstract-feature2.svg
          altText: Rappels automatiques
          styles:
            self:
              borderRadius: x-large
          type: ImageBlock
        colors: bg-light-fg-dark
        styles:
          self:
            padding:
              - pt-8
              - pl-8
              - pb-8
              - pr-8
            borderRadius: x-large
            flexDirection: col
        type: FeaturedItem
      - title: Feature Item Three
        tagline: Suivi Longitudinal
        subtitle: Évolution patient
        text: |
          Suivi complet de l'évolution des patients avec graphiques interactifs
          et indicateurs de progression pour optimiser les soins.
        image:
          url: /images/abstract-feature1.svg
          altText: Suivi patient
          styles:
            self:
              borderRadius: x-large
          type: ImageBlock
        colors: bg-light-fg-dark
        styles:
          self:
            padding:
              - pt-8
              - pl-8
              - pb-8
              - pr-8
            borderRadius: x-large
            flexDirection: col
        type: FeaturedItem
    variant: three-col-grid
    colors: bg-neutral-fg-dark
    styles:
      self:
        padding:
          - pt-16
          - pl-8
          - pb-16
          - pr-8
        justifyContent: center
      subtitle:
        textAlign: center
    type: FeaturedItemsSection
  - title:
      text: Contact Équipe Médicale
      color: text-dark
      type: TitleBlock
    subtitle: Support et assistance technique
    text: |-
      Pour toute question concernant le système RAAC PROMs, formation du personnel
      ou support technique, notre équipe est à votre disposition pour vous accompagner
      dans l'utilisation optimale de cette solution médicale.
    media:
      fields:
        - name: name
          label: Name
          hideLabel: true
          placeholder: Votre nom
          isRequired: true
          width: full
          type: TextFormControl
        - name: email
          label: Email
          hideLabel: true
          placeholder: Votre email professionnel
          isRequired: true
          width: full
          type: EmailFormControl
        - name: message
          label: Message
          hideLabel: true
          placeholder: Votre demande concernant le système RAAC
          width: full
          type: TextareaFormControl
      elementId: contact-form
      styles:
        self:
          padding:
            - pt-6
            - pb-6
            - pl-6
            - pr-6
          borderColor: border-dark
          borderStyle: solid
          borderWidth: 1
          borderRadius: large
      type: FormBlock
      submitButton:
        type: SubmitButtonFormControl
        label: Envoyer la demande
        showIcon: false
        icon: arrowRight
        iconPosition: right
        style: primary
        elementId: null
    badge:
      label: Support Médical
      color: text-primary
      type: Badge
    colors: bg-light-fg-dark
    type: GenericSection
seo:
  metaTitle: RAAC PROMs - Polyclinique Côte Basque Sud
  metaDescription: Système de suivi des Patient Reported Outcome Measures pour la chirurgie orthopédique - Polyclinique Côte Basque Sud.
  socialImage: /images/main-hero.jpg
  type: Seo
type: PageLayout
---
