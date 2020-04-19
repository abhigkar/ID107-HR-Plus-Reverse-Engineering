
#include "jspin.h"

void jswrap_id107hp_setPollInterval(JsVarFloat interval);

JsVar *jswrap_id107hp_getAccel();

void jswrap_id107hp_accelWr(JsVarInt reg, JsVarInt data);
int jswrap_id107hp_accelRd(JsVarInt reg);
void jswrap_id107hp_off();

void jswrap_id107hp_init();
void jswrap_id107hp_kill();
bool jswrap_id107hp_idle();