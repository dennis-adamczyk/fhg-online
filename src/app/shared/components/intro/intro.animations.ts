import {
  animate,
  keyframes,
  query,
  stagger,
  state,
  style,
  transition,
  trigger,
  group
} from '@angular/animations';

export const introAnimations = [
  trigger('sectionChange', [
    transition('* => next', [
      query(
        ':enter, :leave',
        style({
          transform: 'translateX(0)'
        }),
        {
          optional: true
        }
      ),

      query(
        ':enter, :leave',
        animate(
          '350ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          keyframes([
            style({ transform: 'translateX(0)', offset: 0 }),
            style({ transform: 'translateX(-100%)', offset: 0.99999999999 }),
            style({ transform: 'translateX(0)', offset: 1 })
          ])
        ),
        { optional: true }
      ),
      query(
        ':enter, :leave',
        style({
          transform: 'translateX(0)'
        }),
        { optional: true }
      )
    ]),
    transition('* => prev', [
      query(
        ':enter, :leave',
        style({
          transform: 'translateX(-100%)'
        }),
        {
          optional: true
        }
      ),

      query(
        ':enter, :leave',
        animate(
          '350ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          keyframes([
            style({ transform: 'translateX(-100%)' }),
            style({ transform: 'translateX(0)' })
          ])
        ),
        { optional: true }
      )
    ])
  ]),
  trigger('fadeOut', [
    state(
      'true',
      style({
        opacity: 0
      })
    ),
    state('false', style({ opacity: 1 })),
    transition('* <=> *', animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  ])
];
