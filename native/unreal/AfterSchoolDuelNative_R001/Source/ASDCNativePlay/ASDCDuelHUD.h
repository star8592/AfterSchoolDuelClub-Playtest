#pragma once
#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "ASDCDuelHUD.generated.h"
UCLASS()
class ASDCNATIVEPLAY_API AASDCDuelHUD : public AHUD {
 GENERATED_BODY()
public:
 virtual void DrawHUD() override;
};
