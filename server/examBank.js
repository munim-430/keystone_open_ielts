/**
 * IELTS CD Mock Test Platform - Official Authentic Exam Bank
 * Full 4-module test papers with authentic questions, passages, and answer keys
 */

const ACADEMIC_TEST_1 = {
  id: 'academic_test_1',
  title: 'Official IELTS Academic Practice Test 1',
  type: 'Academic',

  // ==========================================
  // MODULE 1: LISTENING (40 Questions)
  // ==========================================
  listening: {
    durationMinutes: 30,
    checkTimeMinutes: 2,
    audioDurationSeconds: 1540,
    parts: [
      {
        partNumber: 1,
        title: 'Part 1: University Accommodation Registration',
        context: 'A prospective international student is calling the University Accommodation Office to arrange campus housing.',
        instructions: 'Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
        audioCue: 'Part 1 - Questions 1 to 10',
        transcript: `OFFICER: Good morning, International Student Housing. How can I help you?
STUDENT: Hello. I have been accepted for the Master of Data Science program starting next month, and I need to register for campus housing.
OFFICER: Congratulations! Let me take down your details. What is your full name?
STUDENT: It's Samuel Henderson. That's H-E-N-D-E-R-S-O-N.
OFFICER: Thank you, Samuel. And your student identification number?
STUDENT: It's DS-84920.
OFFICER: Got it. Which type of accommodation are you looking for? We have catered halls, self-catered flats, and studio apartments.
STUDENT: I prefer a self-catered flat because I enjoy cooking my own meals.
OFFICER: Fine. And what is your maximum weekly budget?
STUDENT: I was hoping to keep it under 180 pounds per week.
OFFICER: 180 pounds. That gives us several good options. Do you have any dietary or medical requirements we should note?
STUDENT: I am asthmatic, so I need a strictly non-smoking room and ideally not on the ground floor.
OFFICER: Noted: non-smoking and upper floor. Now, regarding arrival, when do you plan to check in?
STUDENT: My flight lands on the 15th of September.
OFFICER: September 15th. Check-in starts at 10 AM on that day. Which campus location would you prefer?
STUDENT: The North Campus, close to the Engineering library.
OFFICER: Perfect. We have a shared apartment in Elmwood Court. The deposit is 250 pounds, payable upon contract signing.
STUDENT: That sounds great. What deposit method is accepted?
OFFICER: You can pay by credit card or bank transfer through our online portal.
STUDENT: Excellent. Thank you very much!`,
        questions: [
          { id: 1, type: 'fill_blank', prompt: 'Student Name: Samuel ______', answer: ['henderson'], questionType: 'form_completion' },
          { id: 2, type: 'fill_blank', prompt: 'Student ID Number: DS-______', answer: ['84920'], questionType: 'form_completion' },
          { id: 3, type: 'fill_blank', prompt: 'Course of study: Master of ______ Science', answer: ['data'], questionType: 'form_completion' },
          { id: 4, type: 'fill_blank', prompt: 'Preferred housing type: ______ flat', answer: ['self-catered', 'self catered'], questionType: 'form_completion' },
          { id: 5, type: 'fill_blank', prompt: 'Maximum budget per week: £______', answer: ['180', '180 pounds'], questionType: 'form_completion' },
          { id: 6, type: 'fill_blank', prompt: 'Medical condition requiring attention: ______', answer: ['asthma', 'asthmatic'], questionType: 'form_completion' },
          { id: 7, type: 'fill_blank', prompt: 'Floor preference: ______ floor', answer: ['upper'], questionType: 'form_completion' },
          { id: 8, type: 'fill_blank', prompt: 'Date of planned arrival: 15th ______', answer: ['september'], questionType: 'form_completion' },
          { id: 9, type: 'fill_blank', prompt: 'Preferred campus zone: ______ Campus', answer: ['north'], questionType: 'form_completion' },
          { id: 10, type: 'fill_blank', prompt: 'Required security deposit: £______', answer: ['250', '250 pounds'], questionType: 'form_completion' }
        ]
      },
      {
        partNumber: 2,
        title: 'Part 2: City Botanical Garden Orientation',
        context: 'A tour guide is welcoming visitors to the newly renovated Riverside Botanical Garden and explaining the layout and visitor guidelines.',
        instructions: 'Choose the correct letter, A, B, or C.',
        audioCue: 'Part 2 - Questions 11 to 20',
        transcript: `GUIDE: Welcome everyone to the Riverside Botanical Garden. Before you begin your self-guided walk, let me highlight a few important updates following our recent renovation. First, our visitor center was originally built in 1925 as an agricultural research station, but today it houses interactive biodiversity exhibits. Opening hours have been extended; we are now open daily from 8:30 AM until 7:00 PM, though the greenhouse closes thirty minutes earlier at 6:30 PM. 
If you look at your map, directly past the main entrance fountain is the Heritage Rose Garden. To your left, across the arched stone bridge, you will find the Mediterranean Pavilion, which features drought-resistant olive and citrus groves. Children especially enjoy the Sensory Garden, located directly behind the cafe near the duck pond.
Please note our preservation policies: photography is permitted throughout the grounds for personal use, but tripods and commercial filming require a prior permit. Picnics are allowed on the Great Lawn, but please ensure all waste is disposed of in the designated recycling bins. Finally, our guided butterfly tours commence every hour on the half-hour from the glass conservatory. Enjoy your visit!`,
        questions: [
          {
            id: 11,
            type: 'multiple_choice',
            prompt: 'The visitor center building was originally constructed as:',
            options: ['A) A private Victorian mansion', 'B) An agricultural research station', 'C) A municipal train depot'],
            answer: 'B',
            questionType: 'multiple_choice'
          },
          {
            id: 12,
            type: 'multiple_choice',
            prompt: 'The indoor greenhouse closes each day at:',
            options: ['A) 6:30 PM', 'B) 7:00 PM', 'C) 8:30 PM'],
            answer: 'A',
            questionType: 'multiple_choice'
          },
          {
            id: 13,
            type: 'multiple_choice',
            prompt: 'To reach the Mediterranean Pavilion from the entrance, visitors must cross:',
            options: ['A) The duck pond', 'B) An arched stone bridge', 'C) The Great Lawn'],
            answer: 'B',
            questionType: 'multiple_choice'
          },
          {
            id: 14,
            type: 'multiple_choice',
            prompt: 'The Sensory Garden for children is situated near:',
            options: ['A) The glass conservatory', 'B) The main entrance fountain', 'C) The cafe and duck pond'],
            answer: 'C',
            questionType: 'multiple_choice'
          },
          {
            id: 15,
            type: 'multiple_choice',
            prompt: 'What requires a special prior permit inside the garden grounds?',
            options: ['A) Picnicking on the Great Lawn', 'B) Using camera tripods for filming', 'C) Sketching the heritage flowers'],
            answer: 'B',
            questionType: 'multiple_choice'
          },
          { id: 16, type: 'fill_blank', prompt: 'Guided tours: Butterfly tours depart every hour on the ______.', answer: ['half-hour', 'half hour'], questionType: 'short_answer' },
          { id: 17, type: 'fill_blank', prompt: 'Location of guided tour departure: glass ______.', answer: ['conservatory'], questionType: 'short_answer' },
          { id: 18, type: 'fill_blank', prompt: 'Designated lawn area for casual picnics: The ______ Lawn.', answer: ['great'], questionType: 'short_answer' },
          { id: 19, type: 'fill_blank', prompt: 'Tree species showcased in the Mediterranean Pavilion: olive and ______.', answer: ['citrus'], questionType: 'short_answer' },
          { id: 20, type: 'fill_blank', prompt: 'Opening time for general public: ______ AM.', answer: ['8:30', '8.30'], questionType: 'short_answer' }
        ]
      },
      {
        partNumber: 3,
        title: 'Part 3: Academic Project Discussion on Urban Microclimates',
        context: 'Two environmental engineering students, Liam and Priya, are discussing their upcoming seminar presentation with their academic advisor, Dr. Martinez.',
        instructions: 'Choose the correct letter, A, B, or C.',
        audioCue: 'Part 3 - Questions 21 to 30',
        transcript: `DR. MARTINEZ: Come in, Liam, Priya. Let us look at your research proposal on urban heat islands in industrial cities. Liam, how did your satellite sensor data collection go?
LIAM: The thermal infrared imagery from Landsat provided high resolution, but we struggled initially with cloud cover interference during the early spring readings.
PRIYA: That is true, but once we applied temporal composite filtering, the surface temperature variance between downtown paved corridors and tree-lined suburbs became unmistakably clear—a temperature differential of up to 4.5 degrees Celsius during peak afternoon hours.
DR. MARTINEZ: That is a substantial gradient. And what specific architectural intervention are you prioritizing in your proposal?
LIAM: Most literature focuses exclusively on green rooftops, but our financial modeling suggests that high-albedo reflective street coatings offer a significantly lower capital cost per square meter while achieving comparable cooling efficacy.
PRIYA: Exactly. However, we agreed that combining cool pavements with strategic street canopy planting yields the greatest benefit for pedestrian comfort.
DR. MARTINEZ: Good point. What about the feedback from the municipal planning department?
LIAM: They were receptive, but their primary concern was maintenance durability—specifically how well the reflective polymer sealant withstands heavy winter snowplows.
PRIYA: So in Section 4, we have added a two-year lifecycle maintenance analysis with case studies from Chicago and Yokohama.
DR. MARTINEZ: Excellent initiative. For your slides next Thursday, make sure to keep the thermodynamic formulas concise and allocate at least five minutes for audience questions.`,
        questions: [
          {
            id: 21,
            type: 'multiple_choice',
            prompt: 'What was the main initial obstacle Liam encountered with satellite data?',
            options: ['A) Low image resolution', 'B) Cloud cover interference', 'C) Excessive sensor calibration costs'],
            answer: 'B',
            questionType: 'multiple_choice'
          },
          {
            id: 22,
            type: 'multiple_choice',
            prompt: 'The measured afternoon temperature difference between downtown and suburbs was up to:',
            options: ['A) 2.5 degrees Celsius', 'B) 3.5 degrees Celsius', 'C) 4.5 degrees Celsius'],
            answer: 'C',
            questionType: 'multiple_choice'
          },
          {
            id: 23,
            type: 'multiple_choice',
            prompt: 'Why do the students recommend reflective street coatings over green roofs?',
            options: ['A) Lower capital installation cost', 'B) Faster city council approval', 'C) Greater carbon absorption'],
            answer: 'A',
            questionType: 'multiple_choice'
          },
          {
            id: 24,
            type: 'multiple_choice',
            prompt: 'The municipal planning department was most concerned about:',
            options: ['A) Glare for motorists', 'B) Durability under winter maintenance', 'C) Aesthetics of light-colored streets'],
            answer: 'B',
            questionType: 'multiple_choice'
          },
          {
            id: 25,
            type: 'multiple_choice',
            prompt: 'To address the council’s concern, the students added case studies from:',
            options: ['A) Chicago and Yokohama', 'B) Toronto and Tokyo', 'C) Oslo and Vancouver'],
            answer: 'A',
            questionType: 'multiple_choice'
          },
          { id: 26, type: 'fill_blank', prompt: 'Best pedestrian comfort achieved by pairing cool pavements with street ______ planting.', answer: ['canopy'], questionType: 'summary_completion' },
          { id: 27, type: 'fill_blank', prompt: 'Data technique used to eliminate cloud distortion: temporal ______ filtering.', answer: ['composite'], questionType: 'summary_completion' },
          { id: 28, type: 'fill_blank', prompt: 'Type of satellite imagery analyzed: thermal ______.', answer: ['infrared'], questionType: 'summary_completion' },
          { id: 29, type: 'fill_blank', prompt: 'Duration of the proposed lifecycle maintenance analysis: ______ years.', answer: ['two', '2'], questionType: 'summary_completion' },
          { id: 30, type: 'fill_blank', prompt: 'Dr. Martinez advises saving at least ______ minutes for audience questions.', answer: ['five', '5'], questionType: 'summary_completion' }
        ]
      },
      {
        partNumber: 4,
        title: 'Part 4: Biomimicry and Marine Engineering',
        context: 'An academic lecture delivered by Professor Angela Wright on how marine organisms inspire modern hydrodynamic propulsion and low-drag hulls.',
        instructions: 'Complete the lecture notes below. Write NO MORE THAN TWO WORDS for each answer.',
        audioCue: 'Part 4 - Questions 31 to 40',
        transcript: `PROFESSOR: Good afternoon. Today we examine biomimicry—the practice of emulating nature’s time-tested designs—within naval architecture and marine energy harvesting. For over four billion years, evolution has refined organisms to navigate dense fluids with astonishing energy efficiency.
Consider first the humpback whale, an animal weighing up to forty metric tons. Despite their immense mass, these creatures execute tight underwater turning circles. Biologists discovered that the leading edge of their pectoral flippers is not smooth; rather, it features a series of scalloped bumps termed tubercles. Wind tunnel and flume simulations reveal that these tubercles channel water into vortices, preventing fluid stall at steep angles of attack and reducing drag by up to thirty-two percent. Modern engineers are now integrating tubercle-inspired serrations onto wind turbine blades and submarine rudders.
Next, let us turn to the dermal denticles of the pelagic shark. Under scanning electron microscopy, shark skin reveals tiny grooved riblets aligned with the flow direction. These microscopic ribs suppress turbulent cross-flow eddies close to the surface, resulting in an eight percent reduction in overall friction drag. In maritime shipping, where bunker fuel accounts for over sixty percent of operational expenditures, applying biomimetic riblet coatings to cargo supertankers offers monumental emissions reductions.
Finally, researchers at the MIT Biomimetics Laboratory have developed the RoboTuna, an autonomous underwater vehicle that mimics the carangiform oscillation of tuna caudal fins. Rather than utilizing conventional rotary propellers that generate disruptive cavitation bubbles and acoustic pollution, the mechanical tuna achieves eighty-six percent propulsive efficiency through synchronized flexure, enabling silent deep-sea reconnaissance with minimal energy expenditure.`,
        questions: [
          { id: 31, type: 'fill_blank', prompt: 'Organism study: Humpback flipper bumps are officially termed ______.', answer: ['tubercles'], questionType: 'lecture_notes' },
          { id: 32, type: 'fill_blank', prompt: 'Tubercle structures channel water flow into rotating ______.', answer: ['vortices'], questionType: 'lecture_notes' },
          { id: 33, type: 'fill_blank', prompt: 'Tubercle designs reduce drag at steep angles by up to ______ percent.', answer: ['32', 'thirty-two'], questionType: 'lecture_notes' },
          { id: 34, type: 'fill_blank', prompt: 'Industrial application: Tubercle patterns are added to wind ______ blades.', answer: ['turbine'], questionType: 'lecture_notes' },
          { id: 35, type: 'fill_blank', prompt: 'Shark skin microscopic scales are known as dermal ______.', answer: ['denticles'], questionType: 'lecture_notes' },
          { id: 36, type: 'fill_blank', prompt: 'Microscopic grooved ridges on shark skin are called ______.', answer: ['riblets'], questionType: 'lecture_notes' },
          { id: 37, type: 'fill_blank', prompt: 'Riblets function by suppressing turbulent surface ______.', answer: ['eddies'], questionType: 'lecture_notes' },
          { id: 38, type: 'fill_blank', prompt: 'Bunker fuel constitutes more than ______ percent of maritime shipping costs.', answer: ['60', 'sixty'], questionType: 'lecture_notes' },
          { id: 39, type: 'fill_blank', prompt: 'Rotary propellers create acoustic noise and damaging ______ bubbles.', answer: ['cavitation'], questionType: 'lecture_notes' },
          { id: 40, type: 'fill_blank', prompt: 'RoboTuna attains a propulsive efficiency rate of ______ percent.', answer: ['86', 'eighty-six'], questionType: 'lecture_notes' }
        ]
      }
    ]
  },

  // ==========================================
  // MODULE 2: ACADEMIC READING (40 Questions)
  // ==========================================
  reading: {
    durationMinutes: 60,
    passages: [
      {
        passageNumber: 1,
        title: 'The Dawn of Commercial Jet Aviation',
        subtitle: 'How metallurgy and pressurized cabins reshaped twentieth-century global transport',
        text: `The post-war era witnessed an unprecedented acceleration in aeronautical innovation. Prior to 1950, commercial transcontinental journeys were dominated by multi-engine piston aircraft. These machines were noisy, prone to severe turbulence within the troposphere, and mechanically temperamental, requiring intensive ground overhaul after every few dozen flight hours. The aviation community recognized that entering the calm, rarified air of the lower stratosphere—above 30,000 feet—held the key to faster, smoother, and vastly more fuel-efficient air transit.

However, operating in the stratosphere required two fundamental technological breakthroughs: high-bypass jet propulsion capable of sustained thrust, and hermetically sealed, pressurized cabins to sustain human respiration in near-vacuum atmospheric conditions. The British De Havilland Comet, introduced in May 1952, was hailed as the undisputed pioneer of this brave new world. With its four sleek Rolls-Royce Ghost centrifugal engines buried cleanly inside the wing roots, the Comet flew nearly fifty percent faster than any piston predecessor and cut travel times between London and Johannesburg by more than half.

Tragedy, however, soon shadowed this triumphant debut. Within two years of regular service, three Comets mysteriously disintegrated mid-flight with the total loss of all crew and passengers. Grounding orders were issued immediately, launching what became the most exhaustive forensic aviation investigation in human history. Led by Sir Arnold Hall at the Royal Aircraft Establishment in Farnborough, engineers constructed a colossal water tank large enough to submerge an entire Comet fuselage. By pumping water in and out of the submerged hull around the clock, they simulated thousands of rapid cabin pressurization cycles.

The investigation uncovered a phenomenon virtually unrecognized by contemporary materials engineers: cyclic metal fatigue. Each time the aircraft climbed to altitude, the cabin inflated like a balloon; upon descending, it deflated. Over repeated cycles, microscopic micro-fractures nucleated at stress concentrations around the aircraft's square passenger windows. These micro-cracks propagated invisibly through the thin aluminum skin until catastrophic explosive structural failure occurred.

The hard-earned lessons of the Comet fundamentally revolutionized aeronautical engineering worldwide. Fuselage windows were redesigned with rounded corners to dissipate stress concentrations evenly, thicker riveted tear-straps were integrated along the hull skin to arrest potential cracks, and mandatory cyclic fatigue testing became an international airworthiness standard. When American manufacturer Boeing subsequently launched the 707 in 1958, it inherited these vital structural principles, setting the safety paradigm that underpins modern commercial flight to this day.`,
        questions: [
          {
            id: 1,
            type: 'tfng',
            prompt: 'Before 1950, commercial piston aircraft routinely operated above 30,000 feet.',
            answer: 'FALSE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph 1 states piston aircraft flew within the troposphere and aviation needed breakthroughs to enter above 30,000 feet.'
          },
          {
            id: 2,
            type: 'tfng',
            prompt: 'The De Havilland Comet halved the journey duration between London and Johannesburg.',
            answer: 'TRUE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph 2 confirms the Comet "cut travel times between London and Johannesburg by more than half."'
          },
          {
            id: 3,
            type: 'tfng',
            prompt: 'The Comet’s jet engines were mounted in external pods suspended below the wings.',
            answer: 'FALSE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph 2 notes the engines were "buried cleanly inside the wing roots", not suspended in external pods.'
          },
          {
            id: 4,
            type: 'tfng',
            prompt: 'Sir Arnold Hall had previously worked as a pilot for British Overseas Airways Corporation.',
            answer: 'NOT GIVEN',
            questionType: 'true_false_not_given',
            explanation: 'The text mentions his investigation at the RAE Farnborough but gives no details about his prior employment as a pilot.'
          },
          {
            id: 5,
            type: 'tfng',
            prompt: 'A giant water tank was utilized to simulate the pressures of repeated flight cycles on the Comet.',
            answer: 'TRUE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph 3 describes constructing a colossal water tank to pump water in and out, simulating thousands of pressurization cycles.'
          },
          {
            id: 6,
            type: 'tfng',
            prompt: 'Microscopic cracks originated predominantly around the square-shaped passenger windows.',
            answer: 'TRUE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph 4 states micro-fractures nucleated at stress concentrations around the square windows.'
          },
          {
            id: 7,
            type: 'tfng',
            prompt: 'The Boeing 707 experienced identical metal fatigue failures during its initial passenger flights.',
            answer: 'FALSE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph 5 states the Boeing 707 inherited the lessons and structural principles, setting the modern safety paradigm.'
          },
          { id: 8, type: 'fill_blank', prompt: 'Prior to 1950, commercial airplanes encountered bad turbulence in the ______.', answer: ['troposphere'], questionType: 'summary_completion' },
          { id: 9, type: 'fill_blank', prompt: 'High-altitude flight required hermetically sealed and ______ cabins.', answer: ['pressurized', 'pressurised'], questionType: 'summary_completion' },
          { id: 10, type: 'fill_blank', prompt: 'The newly discovered physical phenomenon was termed cyclic ______.', answer: ['metal fatigue'], questionType: 'summary_completion' },
          { id: 11, type: 'fill_blank', prompt: 'The investigation was conducted by the Royal Aircraft Establishment in ______.', answer: ['farnborough'], questionType: 'summary_completion' },
          { id: 12, type: 'fill_blank', prompt: 'Modern aircraft windows feature ______ corners to disperse pressure concentrations.', answer: ['rounded'], questionType: 'summary_completion' },
          { id: 13, type: 'fill_blank', prompt: 'Structural components known as tear-______ were riveted to stop crack propagation.', answer: ['straps'], questionType: 'summary_completion' }
        ]
      },
      {
        passageNumber: 2,
        title: 'Neuroplasticity and the Architecture of Memory',
        subtitle: 'Exploring how sleep spindles and synaptic pruning consolidate human learning',
        text: `Paragraph A
For centuries, classical neurobiology treated the adult mammalian brain as a fixed, immutable biological machine. It was widely asserted that neurogenesis—the birth of new neurons—ceased abruptly at the conclusion of early childhood, leaving adults with an ever-diminishing stock of brain cells. Over the past three decades, however, this dogma has been dismantled by the discovery of neuroplasticity: the central nervous system’s dynamic ability to continuously rewire synaptic pathways, form new cellular connections, and even generate nascent neurons within specific germinal niches throughout an individual’s lifetime.

Paragraph B
At the molecular heart of neuroplasticity lies Long-Term Potentiation (LTP). First observed in the hippocampus by Terje Lømo in 1966, LTP is the persistent strengthening of synapses based on recent patterns of activity. When two neighboring neurons repeatedly fire in close temporal succession, biochemical changes take place on both sides of the synapse. Calcium ions flood through NMDA receptors, triggering a cascade of intracellular protein kinases that recruit additional AMPA receptors to the postsynaptic membrane. This molecular reorganization lowers the activation threshold, converting fleeting short-term experiences into robust, enduring neural pathways.

Paragraph C
Yet synaptic strengthening is only half the cognitive equation. If every sensory impression continuously fortified synapses, the human brain would quickly suffer from metabolic exhaustion and catastrophic synaptic saturation. Here enters the critical biological imperative of sleep. Under the Synaptic Homeostasis Hypothesis formulated by Giulio Tononi and Chiara Cirelli, non-rapid eye movement (NREM) slow-wave sleep acts as a universal recalibration mechanism. During this phase, global downscaling selectively prunes weak or irrelevant synaptic connections, freeing up metabolic energy and memory storage capacity while preserving the essential high-potency connections forged during daytime learning.

Paragraph D
Simultaneously, during sleep, the hippocampus engages in high-speed informational dialog with the neocortex. Neuroscientists have documented bursts of high-frequency oscillatory activity, known as sharp-wave ripples and thalamocortical sleep spindles. These synchronous electrical rhythms act as biological conduits, transferring fragile, newly encoded autobiographical memories from their temporary repository in the hippocampus to the permanent archival networks of the neocortex. Experiments demonstrate that subjects denied slow-wave sleep retain less than forty percent of newly acquired motor or declarative skills compared to well-rested peers.

Paragraph E
These breakthroughs have sparked practical clinical revolutions. Targeted cognitive training, paired with non-invasive transcranial electrical stimulation and aerobic exercise, has shown measurable success in rehabilitating stroke patients who have lost speech or motor control. By systematically activating adjacent, uninjured cortical regions, therapists can induce these healthy neural circuits to adopt the specialized functions once performed by damaged tissue, providing conclusive proof of the lifelong plasticity of the human mind.`,
        questions: [
          {
            id: 14,
            type: 'matching_headings',
            prompt: 'Which heading matches Paragraph A?',
            options: [
              'i. The molecular mechanics of synaptic transmission',
              'ii. Dismantling the historic myth of the static adult brain',
              'iii. The restorative role of sleep in pruning neural connections',
              'iv. Translating neural flexibility into medical rehabilitation',
              'v. The nocturnal transfer of memories to permanent storage'
            ],
            answer: 'ii',
            questionType: 'matching_headings'
          },
          {
            id: 15,
            type: 'matching_headings',
            prompt: 'Which heading matches Paragraph B?',
            options: [
              'i. The molecular mechanics of synaptic transmission',
              'ii. Dismantling the historic myth of the static adult brain',
              'iii. The restorative role of sleep in pruning neural connections',
              'iv. Translating neural flexibility into medical rehabilitation',
              'v. The nocturnal transfer of memories to permanent storage'
            ],
            answer: 'i',
            questionType: 'matching_headings'
          },
          {
            id: 16,
            type: 'matching_headings',
            prompt: 'Which heading matches Paragraph C?',
            options: [
              'i. The molecular mechanics of synaptic transmission',
              'ii. Dismantling the historic myth of the static adult brain',
              'iii. The restorative role of sleep in pruning neural connections',
              'iv. Translating neural flexibility into medical rehabilitation',
              'v. The nocturnal transfer of memories to permanent storage'
            ],
            answer: 'iii',
            questionType: 'matching_headings'
          },
          {
            id: 17,
            type: 'matching_headings',
            prompt: 'Which heading matches Paragraph D?',
            options: [
              'i. The molecular mechanics of synaptic transmission',
              'ii. Dismantling the historic myth of the static adult brain',
              'iii. The restorative role of sleep in pruning neural connections',
              'iv. Translating neural flexibility into medical rehabilitation',
              'v. The nocturnal transfer of memories to permanent storage'
            ],
            answer: 'v',
            questionType: 'matching_headings'
          },
          {
            id: 18,
            type: 'matching_headings',
            prompt: 'Which heading matches Paragraph E?',
            options: [
              'i. The molecular mechanics of synaptic transmission',
              'ii. Dismantling the historic myth of the static adult brain',
              'iii. The restorative role of sleep in pruning neural connections',
              'iv. Translating neural flexibility into medical rehabilitation',
              'v. The nocturnal transfer of memories to permanent storage'
            ],
            answer: 'iv',
            questionType: 'matching_headings'
          },
          {
            id: 19,
            type: 'tfng',
            prompt: 'Historically, scientists believed adult humans could not generate any new neurons.',
            answer: 'TRUE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph A explains that neurogenesis was thought to cease abruptly at the conclusion of early childhood.'
          },
          {
            id: 20,
            type: 'tfng',
            prompt: 'Terje Lømo discovered Long-Term Potentiation while conducting clinical human trials in 1966.',
            answer: 'NOT GIVEN',
            questionType: 'true_false_not_given',
            explanation: 'The text notes Lømo observed LTP in 1966 in the hippocampus, but does not state whether it was in human clinical trials.'
          },
          {
            id: 21,
            type: 'tfng',
            prompt: 'Without sleep, the brain could experience metabolic exhaustion due to excessive synaptic growth.',
            answer: 'TRUE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph C states that if every impression fortified synapses, the brain would suffer metabolic exhaustion.'
          },
          {
            id: 22,
            type: 'tfng',
            prompt: 'Sharp-wave ripples originate exclusively within the human cerebellum.',
            answer: 'FALSE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph D links sharp-wave ripples and sleep spindles to the dialog between the hippocampus and neocortex.'
          },
          { id: 23, type: 'fill_blank', prompt: 'The biological phenomenon of creating fresh neurons is termed ______.', answer: ['neurogenesis'], questionType: 'sentence_completion' },
          { id: 24, type: 'fill_blank', prompt: 'During LTP, calcium ions enter through ______ receptors.', answer: ['nmda'], questionType: 'sentence_completion' },
          { id: 25, type: 'fill_blank', prompt: 'During slow-wave sleep, synaptic ______ eliminates irrelevant connections.', answer: ['downscaling', 'pruning'], questionType: 'sentence_completion' },
          { id: 26, type: 'fill_blank', prompt: 'Stroke therapy uses aerobic exercise and non-invasive transcranial ______ stimulation.', answer: ['electrical'], questionType: 'sentence_completion' }
        ]
      },
      {
        passageNumber: 3,
        title: 'Algorithmic Oceanography: Machine Learning in Deep-Sea Ecology',
        subtitle: 'Autonomous gliders and computer vision are illuminating Earth’s least explored biomes',
        text: `The pelagic abyss, extending from two hundred meters beneath the surface down to the midnight depths of the hadal trenches, comprises over ninety percent of the habitable volume of planet Earth. Yet until recently, oceanographers possessed more detailed topographical maps of the lunar surface than of our own seabed. Traditional oceanographic research relied almost exclusively on research vessels towing mechanical benthic sleds or lowering acoustic transponders. Such expeditions were logistically burdensome, exorbitantly expensive—often exceeding $80,000 per operational day—and fundamentally limited by coarse spatial resolution.

The advent of algorithmic oceanography is radically transforming this paradigm. Fleets of autonomous underwater gliders, propelled not by fossil-fueled engines but by buoyancy-engine bladder shifts and hydrodynamic wings, now drift quietly through the water column for up to nine months at a stretch. Equipped with multi-spectral fluorometers, acoustic Doppler current profilers, and high-definition stereoscopic cameras, these robotic sentinels continuously capture vast streams of biogeochemical data across previously inaccessible oceanic expanses.

Processing this oceanic deluge of high-definition imagery has historically represented an intractable bottleneck. A single glider mission can accumulate millions of frames containing everything from bioluminescent jellyfish and siphonophores to suspended marine snow aggregates. Human taxonomists could spend years annotating just a fraction of a single mission's visual catalog. To overcome this, marine computational scientists have trained deep convolutional neural networks (CNNs) on extensive open-access benthic libraries like FathomNet. These machine learning models automatically identify, segment, and enumerate marine organisms down to species level with an accuracy exceeding ninety-three percent, while simultaneously calculating biometric parameters such as biomass volume and swimming velocity.

Beyond automated taxonomy, predictive AI models are resolving longstanding mysteries surrounding the ocean’s biological carbon pump. Marine organisms absorb dissolved atmospheric carbon dioxide near the sunlit surface; when they die or excrete organic matter, this carbon sinks toward the abyss as ‘marine snow’, effectively sequestering carbon for centuries. By correlating satellite telemetry of surface phytoplankton blooms with subsurface glider sensor data, machine learning algorithms have revealed that microbial degradation rates vary wildly depending on deep-sea water temperature anomalies. 

Crucially, this algorithmic synthesis enables real-time ecological governance. In the High Seas, where international jurisdictions blur and illegal, unreported, and unregulated (IUU) industrial fishing flourishes, autonomous acoustic arrays running edge-computing classification models can detect the low-frequency acoustic signature of illegal driftnets and longlines. The system instantly transmits encrypted satellite alert beacons to maritime coastguards, closing the enforcement gap across international marine protected areas.`,
        questions: [
          {
            id: 27,
            type: 'multiple_choice',
            prompt: 'According to Paragraph 1, conventional deep-sea expeditions were primarily constrained by:',
            options: [
              'A) Unpredictable weather patterns in the southern hemisphere',
              'B) High operational expenses and coarse spatial resolution',
              'C) Lack of qualified human taxonomists',
              'D) Opposition from international fishing syndicates'
            ],
            answer: 'B',
            questionType: 'multiple_choice'
          },
          {
            id: 28,
            type: 'multiple_choice',
            prompt: 'Autonomous underwater gliders achieve forward propulsion through:',
            options: [
              'A) Nuclear-powered micro-turbines',
              'B) Solar-powered high-torque propellers',
              'C) Buoyancy shifts and hydrodynamic wings',
              'D) Tow lines connected to research vessels'
            ],
            answer: 'C',
            questionType: 'multiple_choice'
          },
          {
            id: 29,
            type: 'multiple_choice',
            prompt: 'Deep convolutional neural networks are utilized to:',
            options: [
              'A) Control the steering rudders of commercial cargo ships',
              'B) Automatically identify and enumerate marine species from video frames',
              'C) Extract deep-sea minerals from hydrothermal vents',
              'D) Track the migration routes of commercially harvested tuna'
            ],
            answer: 'B',
            questionType: 'multiple_choice'
          },
          {
            id: 30,
            type: 'multiple_choice',
            prompt: 'The term ‘marine snow’ refers to:',
            options: [
              'A) Polar ice caps melting into cold deep currents',
              'B) Sinking organic matter that transports carbon to the ocean floor',
              'C) Micro-plastic debris suspended near coastal estuaries',
              'D) Bioluminescent chemical reactions produced by deep-sea organisms'
            ],
            answer: 'B',
            questionType: 'multiple_choice'
          },
          {
            id: 31,
            type: 'multiple_choice',
            prompt: 'Edge-computing acoustic arrays help maritime authorities by:',
            options: [
              'A) Warning commercial vessels about incoming rogue waves',
              'B) Detecting the unique sounds of illegal fishing equipment and sending alerts',
              'C) Generating acoustic maps to facilitate offshore oil drilling',
              'D) Communicating with pods of endangered blue whales'
            ],
            answer: 'B',
            questionType: 'multiple_choice'
          },
          {
            id: 32,
            type: 'tfng',
            prompt: 'The pelagic abyss accounts for more than 90% of Earth’s habitable volume.',
            answer: 'TRUE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph 1 explicitly confirms the pelagic abyss comprises over ninety percent of the habitable volume.'
          },
          {
            id: 33,
            type: 'tfng',
            prompt: 'Autonomous gliders must return to port every two weeks to recharge batteries.',
            answer: 'FALSE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph 2 notes that gliders drift quietly through the water column for up to nine months at a stretch.'
          },
          {
            id: 34,
            type: 'tfng',
            prompt: 'FathomNet is a proprietary database restricted exclusively to military researchers.',
            answer: 'FALSE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph 3 describes FathomNet as an "extensive open-access benthic library."'
          },
          {
            id: 35,
            type: 'tfng',
            prompt: 'CNN models have reached an identification accuracy of over 93% for marine species.',
            answer: 'TRUE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph 3 states CNN models enumerate organisms with an accuracy exceeding ninety-three percent.'
          },
          {
            id: 36,
            type: 'tfng',
            prompt: 'Satellite telemetry alone is sufficient to calculate exact deep-sea microbial decomposition rates.',
            answer: 'FALSE',
            questionType: 'true_false_not_given',
            explanation: 'Paragraph 4 states scientists correlate satellite telemetry of surface blooms with subsurface glider sensor data.'
          },
          { id: 37, type: 'fill_blank', prompt: 'Traditional research ships often cost over $______ per operational day.', answer: ['80000', '80,000'], questionType: 'summary_completion' },
          { id: 38, type: 'fill_blank', prompt: 'Autonomous gliders carry sensors such as acoustic ______ current profilers.', answer: ['doppler'], questionType: 'summary_completion' },
          { id: 39, type: 'fill_blank', prompt: 'Sinking organic particulate matter is commonly known as marine ______.', answer: ['snow'], questionType: 'summary_completion' },
          { id: 40, type: 'fill_blank', prompt: 'Acoustic arrays running edge-computing detect low-frequency signatures of illegal ______.', answer: ['driftnets'], questionType: 'summary_completion' }
        ]
      }
    ]
  },

  // ==========================================
  // MODULE 3: WRITING
  // ==========================================
  writing: {
    durationMinutes: 60,
    tasks: [
      {
        taskNumber: 1,
        title: 'Task 1: Academic Report',
        suggestedMinutes: 20,
        minWords: 150,
        prompt: `You should spend about 20 minutes on this task.

The chart below shows the share of total electricity generated from renewable energy sources (wind, solar, and hydro) in four European countries between 2010 and 2024.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
        graphicType: 'chart',
        graphicData: {
          title: 'Electricity Generated from Renewable Sources (% of Total Grid)',
          years: [2010, 2015, 2020, 2024],
          series: [
            { country: 'Denmark', data: [32, 56, 68, 82] },
            { country: 'Germany', data: [17, 30, 45, 54] },
            { country: 'Spain', data: [35, 37, 44, 51] },
            { country: 'United Kingdom', data: [7, 24, 43, 49] }
          ]
        },
        sampleBand9Overview: 'Overall, all four nations experienced substantial growth in renewable electricity generation over the fourteen-year period. Denmark consistently registered the highest proportion and the most rapid rate of expansion, whereas the United Kingdom recorded the most dramatic proportional rise, climbing from the lowest starting point in 2010 to roughly half of its total electricity supply by 2024.'
      },
      {
        taskNumber: 2,
        title: 'Task 2: Academic Essay',
        suggestedMinutes: 40,
        minWords: 250,
        prompt: `You should spend about 40 minutes on this task.

Write about the following topic:

With the rapid advancement of Artificial Intelligence in academic settings, some argue that human educators will eventually become obsolete, while others maintain that empathy, moral mentorship, and interpersonal inspiration cannot be automated.

Discuss both views and give your own opinion.

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.`
      }
    ]
  },

  // ==========================================
  // MODULE 4: SPEAKING (100% AI Automated)
  // ==========================================
  speaking: {
    durationMinutes: 14,
    parts: [
      {
        partNumber: 1,
        title: 'Part 1: Introduction and Interview',
        description: 'The examiner asks questions about yourself, your home, studies or work, and general familiar topics.',
        durationMinutes: 4,
        questions: [
          {
            id: 's_p1_q1',
            examinerPrompt: 'Good afternoon. My name is Dr. Harrison, and I will be conducting your IELTS Speaking Test today. Could you please state your full name and where you are from?',
            preparationSeconds: 3,
            speakingSeconds: 30
          },
          {
            id: 's_p1_q2',
            examinerPrompt: 'Let us talk about your hometown. What is the most interesting aspect of the place where you grew up?',
            preparationSeconds: 3,
            speakingSeconds: 40
          },
          {
            id: 's_p1_q3',
            examinerPrompt: 'Do you work or are you currently studying? Tell me a little about what you do.',
            preparationSeconds: 3,
            speakingSeconds: 40
          },
          {
            id: 's_p1_q4',
            examinerPrompt: 'How often do you use digital technology in your daily routine, and has it made your life easier or more complicated?',
            preparationSeconds: 3,
            speakingSeconds: 45
          }
        ]
      },
      {
        partNumber: 2,
        title: 'Part 2: Long Turn (Individual Candidate Response)',
        description: 'You will have 1 minute to prepare your talk on the topic below. You may take notes. Then you must speak for 1 to 2 minutes.',
        durationMinutes: 4,
        preparationSeconds: 60,
        speakingSeconds: 120,
        cueCard: {
          topic: 'Describe a significant challenge or obstacle you faced and how you overcame it.',
          bulletPoints: [
            'What the challenge was and when it took place',
            'Why it was difficult or stressful for you',
            'What steps or actions you took to resolve it',
            'And explain what you learned from this experience.'
          ]
        },
        followUpQuestion: 'Did you seek advice from other people when resolving this challenge?'
      },
      {
        partNumber: 3,
        title: 'Part 3: Two-Way Discussion',
        description: 'The examiner will ask broader, more abstract questions related to the theme of challenges, resilience, and problem-solving in modern society.',
        durationMinutes: 5,
        questions: [
          {
            id: 's_p3_q1',
            examinerPrompt: 'Why do some individuals handle professional adversity and high-stress setbacks better than others?',
            preparationSeconds: 5,
            speakingSeconds: 55
          },
          {
            id: 's_p3_q2',
            examinerPrompt: 'To what extent should school curriculums explicitly teach resilience and emotional coping strategies rather than purely academic subjects?',
            preparationSeconds: 5,
            speakingSeconds: 60
          },
          {
            id: 's_p3_q3',
            examinerPrompt: 'How has the reliance on automated smart devices altered people’s capacity to solve everyday real-world problems independently?',
            preparationSeconds: 5,
            speakingSeconds: 60
          },
          {
            id: 's_p3_q4',
            examinerPrompt: 'In the future, will societal challenges become more complex to solve due to globalization and technological interconnectivity? Why or why not?',
            preparationSeconds: 5,
            speakingSeconds: 60
          }
        ]
      }
    ]
  }
};

const EXAM_BANKS = {
  academic_test_1: ACADEMIC_TEST_1
};

module.exports = {
  EXAM_BANKS,
  getExamById: (id) => EXAM_BANKS[id] || ACADEMIC_TEST_1,
  listAvailableExams: () => Object.values(EXAM_BANKS).map(e => ({ id: e.id, title: e.title, type: e.type }))
};
