// src/systems/events-system.js

export class EventsSystem {
  constructor() {
    this.events = {
      // Random events that can occur on event spaces
      random: [
        {
          id: 'coin_shower',
          name: 'Coin Shower!',
          description: 'Coins rain from the sky!',
          effect: (player) => ({
            coins: player.coins + Math.floor(Math.random() * 10) + 5,
            message: `You gained ${Math.floor(Math.random() * 10) + 5} coins!`
          })
        },
        {
          id: 'energy_burst',
          name: 'Energy Burst!',
          description: 'You feel energized!',
          effect: (player) => ({
            energy: Math.min(player.maxEnergy, player.energy + 2),
            message: 'You gained 2 energy!'
          })
        },
        {
          id: 'teleport',
          name: 'Mysterious Portal',
          description: 'A portal appears!',
          effect: (player, board) => {
            const randomSpace = board.spaces[Math.floor(Math.random() * board.spaces.length)];
            return {
              position: randomSpace.id,
              message: `You were teleported to space ${randomSpace.id}!`
            };
          }
        },
        {
          id: 'star_discount',
          name: 'Star Sale!',
          description: 'The next star costs less!',
          effect: (player) => ({
            starDiscount: 10,
            message: 'Your next star purchase costs 10 coins less!'
          })
        },
        {
          id: 'coin_thief',
          name: 'Coin Thief!',
          description: 'A thief steals some coins!',
          effect: (player) => {
            const loss = Math.min(player.coins, Math.floor(Math.random() * 5) + 3);
            return {
              coins: player.coins - loss,
              message: `You lost ${loss} coins!`
            };
          }
        }
      ],
      
      // Chance card events
      chance: [
        {
          id: 'double_dice',
          name: 'Double Dice!',
          description: 'Your next roll uses two dice!',
          effect: (player) => ({
            doubleDice: true,
            message: 'Your next roll will use two dice!'
          })
        },
        {
          id: 'steal_coins',
          name: 'Pickpocket',
          description: 'Steal coins from another player!',
          effect: (player, game) => {
            const otherPlayers = game.players.filter(p => p.userId !== player.userId);
            if (otherPlayers.length === 0) {
              return { message: 'No other players to steal from!' };
            }
            const target = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
            const stolen = Math.min(target.coins, 10);
            return {
              coins: player.coins + stolen,
              targetUpdate: { userId: target.userId, coins: target.coins - stolen },
              message: `You stole ${stolen} coins from ${target.name}!`
            };
          }
        },
        {
          id: 'swap_positions',
          name: 'Position Swap!',
          description: 'Swap positions with another player!',
          effect: (player, game) => {
            const otherPlayers = game.players.filter(p => p.userId !== player.userId);
            if (otherPlayers.length === 0) {
              return { message: 'No other players to swap with!' };
            }
            const target = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
            return {
              position: target.position,
              targetUpdate: { userId: target.userId, position: player.position },
              message: `You swapped positions with ${target.name}!`
            };
          }
        },
        {
          id: 'everyone_loses_coins',
          name: 'Economic Crisis!',
          description: 'Everyone loses coins!',
          effect: (player, game) => {
            const updates = game.players.map(p => ({
              userId: p.userId,
              coins: Math.max(0, p.coins - 5)
            }));
            return {
              globalUpdate: updates,
              message: 'Economic crisis! Everyone loses 5 coins!'
            };
          }
        }
      ],
      
      // Landmark events
      landmark: {
        castle: {
          name: 'Grand Castle',
          description: 'Pay tribute or receive a blessing',
          choices: [
            {
              text: 'Pay 10 coins tribute',
              cost: { coins: 10 },
              effect: (player) => ({
                stars: player.stars + 1,
                message: 'The king grants you a star!'
              })
            },
            {
              text: 'Request blessing',
              cost: {},
              effect: (player) => ({
                maxEnergy: player.maxEnergy + 1,
                energy: player.energy + 1,
                message: 'Your max energy increased by 1!'
              })
            }
          ]
        },
        temple: {
          name: 'Ancient Temple',
          description: 'Make an offering to the gods',
          choices: [
            {
              text: 'Offer 5 coins',
              cost: { coins: 5 },
              effect: (player) => ({
                energy: player.maxEnergy,
                message: 'The gods restore your energy to full!'
              })
            },
            {
              text: 'Pray for fortune',
              cost: {},
              effect: (player) => {
                const roll = Math.random();
                if (roll < 0.3) {
                  return {
                    coins: player.coins + 20,
                    message: 'The gods smile upon you! +20 coins!'
                  };
                } else if (roll < 0.6) {
                  return {
                    energy: player.energy + 1,
                    message: 'You feel slightly refreshed. +1 energy'
                  };
                } else {
                  return {
                    message: 'The gods remain silent...'
                  };
                }
              }
            }
          ]
        },
        market: {
          name: 'Market Square',
          description: 'Buy and sell goods',
          choices: [
            {
              text: 'Buy Energy Potion (15 coins)',
              cost: { coins: 15 },
              effect: (player) => ({
                items: [...(player.items || []), 'energy_potion'],
                message: 'You bought an Energy Potion!'
              })
            },
            {
              text: 'Sell random item for coins',
              cost: {},
              effect: (player) => {
                if (!player.items || player.items.length === 0) {
                  return { message: 'You have no items to sell!' };
                }
                return {
                  coins: player.coins + 10,
                  items: player.items.slice(0, -1),
                  message: 'You sold an item for 10 coins!'
                };
              }
            }
          ]
        },
        lair: {
          name: "Dragon's Lair",
          description: 'Face the dragon or flee!',
          choices: [
            {
              text: 'Fight the dragon!',
              cost: { energy: 2 },
              effect: (player) => {
                const roll = Math.random();
                if (roll < 0.4) {
                  return {
                    coins: player.coins + 50,
                    stars: player.stars + 1,
                    message: 'You defeated the dragon! +50 coins and a star!'
                  };
                } else {
                  return {
                    coins: Math.max(0, player.coins - 20),
                    position: 0, // Back to start
                    message: 'The dragon defeated you! -20 coins and back to start!'
                  };
                }
              }
            },
            {
              text: 'Flee!',
              cost: {},
              effect: (player) => ({
                position: Math.max(0, player.position - 3),
                message: 'You fled and moved back 3 spaces!'
              })
            }
          ]
        },
        portal: {
          name: 'Mystic Portal',
          description: 'Step through to unknown destinations',
          choices: [
            {
              text: 'Enter the portal',
              cost: { energy: 1 },
              effect: (player, board) => {
                // Teleport to another portal or random landmark
                const portals = board.spaces.filter(s => 
                  s.landmark && s.landmark.type === 'portal' && s.id !== player.position
                );
                const destination = portals.length > 0 
                  ? portals[Math.floor(Math.random() * portals.length)]
                  : board.spaces[Math.floor(Math.random() * board.spaces.length)];
                
                return {
                  position: destination.id,
                  message: `You emerged at ${destination.name}!`
                };
              }
            },
            {
              text: 'Study the portal',
              cost: {},
              effect: (player) => ({
                energy: Math.min(player.maxEnergy, player.energy + 1),
                message: 'The portal\'s energy refreshes you. +1 energy'
              })
            }
          ]
        },
        vault: {
          name: 'Treasure Vault',
          description: 'Riches beyond imagination!',
          choices: [
            {
              text: 'Open the vault (requires 3 energy)',
              cost: { energy: 3 },
              effect: (player) => ({
                coins: player.coins + 30,
                message: 'The vault opens! +30 coins!'
              })
            },
            {
              text: 'Search for hidden treasures',
              cost: {},
              effect: (player) => {
                const roll = Math.random();
                if (roll < 0.2) {
                  return {
                    coins: player.coins + 15,
                    message: 'You found a hidden cache! +15 coins!'
                  };
                } else {
                  return {
                    message: 'You search but find nothing...'
                  };
                }
              }
            }